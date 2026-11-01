"""Playwright-based Google Maps scraper.

Flow per query ("<category> in <city>"):
  1. open the Maps search page, accept the consent screen if shown
  2. scroll the results feed, collecting place cards (name, URL, rating, review count)
  3. drop cards that the card data already proves can't match the filters
  4. open each remaining place page and extract full details

Google changes Maps markup from time to time. Selectors are concentrated in the two JS
snippets below (CARDS_JS, PLACE_JS) and lean on aria-label / data-item-id attributes, which
change far less often than class names. If extraction breaks, that's the place to look.
"""

from __future__ import annotations

import asyncio
import os
import random
from dataclasses import dataclass
from typing import Awaitable, Callable
from urllib.parse import quote_plus

from playwright.async_api import Browser, BrowserContext, Page, async_playwright
from playwright.async_api import Error as PlaywrightError
from playwright.async_api import TimeoutError as PlaywrightTimeout

from . import parsing as P
from .filters import FilterSpec
from .models import Business

MAPS_SEARCH = "https://www.google.com/maps/search/{q}?hl=en"

CARDS_JS = r"""
() => {
  const feed = document.querySelector('div[role="feed"]');
  const root = feed || document;
  const links = Array.from(root.querySelectorAll('a[href*="/maps/place/"]'));
  const seen = new Set();
  const out = [];
  for (const a of links) {
    const href = a.href;
    if (!href || seen.has(href)) continue;
    seen.add(href);
    // The card container is the nearest ancestor that is a direct child of the feed.
    let card = a;
    while (card.parentElement && card.parentElement !== feed && card.parentElement !== document.body) {
      card = card.parentElement;
    }
    const stars = card.querySelector('span[role="img"][aria-label*="star" i]');
    const ratingEl = card.querySelector('span.MW4etd');
    const countEl = card.querySelector('span.UY7F9');
    const noReviews = /\bNo reviews\b/i.test(card.innerText || '');
    out.push({
      name: a.getAttribute('aria-label') || (a.innerText || '').trim(),
      href,
      stars_label: stars ? stars.getAttribute('aria-label') : null,
      rating_text: ratingEl ? ratingEl.textContent : null,
      count_text: countEl ? countEl.textContent : null,
      no_reviews: noReviews,
    });
  }
  const end = /You've reached the end of the list/i.test((feed && feed.innerText) || '');
  return { cards: out, end, has_feed: !!feed };
}
"""

PLACE_JS = r"""
() => {
  const txt = el => el ? (el.innerText || el.textContent || '').trim() : null;
  const attr = (el, a) => el ? el.getAttribute(a) : null;
  const mains = Array.from(document.querySelectorAll('div[role="main"]'));
  const main = mains.find(m => m.querySelector('h1')) || document;
  const q = s => main.querySelector(s);

  const h1 = q('h1.DUwDvf') || q('h1');
  const name = txt(h1) || attr(main, 'aria-label');

  let rating_text = null, reviews_text = null;
  const f7 = q('div.F7nice');
  if (f7) {
    rating_text = txt(f7.querySelector('span[aria-hidden="true"]'));
    const r = f7.querySelector('span[aria-label*="review" i]');
    reviews_text = attr(r, 'aria-label') || txt(r);
  }
  if (!rating_text) rating_text = attr(q('span[role="img"][aria-label*="star" i]'), 'aria-label');
  if (!reviews_text) {
    const r = q('[aria-label$="reviews" i], [aria-label$="review" i]');
    reviews_text = attr(r, 'aria-label');
  }

  const category = txt(q('button.DkEaL')) || txt(q('button[jsaction*="category"]'));

  const addrEl = q('button[data-item-id="address"]');
  const phoneEl = q('[data-item-id^="phone:tel:"]');
  const siteEl = q('a[data-item-id="authority"]');
  const plusEl = q('button[data-item-id="oloc"]');

  let hours_label = null;
  const hoursEl = q('div.t39EBf[aria-label]')
    || q('[aria-label*="Hide open hours" i]')
    || q('[aria-label*="Show open hours" i]');
  if (hoursEl) hours_label = attr(hoursEl, 'aria-label');
  if (!hours_label) {
    const rows = Array.from(main.querySelectorAll('table.eK4R0e tr, table.WgFkxc tr'));
    if (rows.length) hours_label = rows.map(r => {
      const c = r.querySelectorAll('td');
      return c.length >= 2 ? `${txt(c[0])}, ${attr(c[1], 'aria-label') || txt(c[1])}` : txt(r);
    }).join('; ');
  }

  const leaf = Array.from(main.querySelectorAll('span, div'))
    .filter(e => e.childElementCount === 0)
    .map(e => (e.textContent || '').trim());
  const permanently_closed = leaf.some(t => /^Permanently closed$/i.test(t));
  const temporarily_closed = leaf.some(t => /^Temporarily closed$/i.test(t));

  const claimEl = q('[data-item-id="merchant"]')
    || Array.from(main.querySelectorAll('a, button')).find(e => /Claim this business/i.test(e.textContent || ''));

  const priceEl = q('span[aria-label^="Price" i]');

  return {
    name,
    rating_text,
    reviews_text,
    category,
    address: attr(addrEl, 'aria-label') || txt(addrEl),
    phone_label: attr(phoneEl, 'aria-label') || txt(phoneEl),
    phone_item_id: attr(phoneEl, 'data-item-id'),
    website: attr(siteEl, 'href'),
    plus_code: attr(plusEl, 'aria-label') || txt(plusEl),
    hours_label,
    permanently_closed,
    temporarily_closed,
    unclaimed: !!claimEl,
    price: attr(priceEl, 'aria-label') || null,
    url: location.href,
  };
}
"""


class BlockedError(RuntimeError):
    """Google served a CAPTCHA / 'unusual traffic' page."""


@dataclass
class Card:
    name: str
    url: str
    rating: float | None
    review_count: int | None


@dataclass
class ScrapeOptions:
    headless: bool = True
    concurrency: int = 2
    max_results_per_query: int = 120
    min_delay: float = 1.0
    max_delay: float = 3.0
    browser_path: str | None = None
    proxy: str | None = None
    retries: int = 3


def card_from_raw(raw: dict) -> Card:
    rating, count = P.parse_stars_label(raw.get("stars_label"))
    if rating is None:
        rating = P.parse_rating(raw.get("rating_text"))
    if count is None:
        count = P.parse_count(raw.get("count_text"))
    if count is None and raw.get("no_reviews"):
        count = 0
    return Card(name=(raw.get("name") or "").strip(), url=raw["href"], rating=rating, review_count=count)


def business_from_raw(raw: dict, *, city: str | None, query: str, card: Card | None = None) -> Business:
    url = raw.get("url") or (card.url if card else None)
    lat, lng = P.parse_coords(url)
    if lat is None and card:
        lat, lng = P.parse_coords(card.url)
    rating = P.parse_rating(raw.get("rating_text"))
    reviews = P.parse_count(raw.get("reviews_text"))
    if card:
        rating = rating if rating is not None else card.rating
        reviews = reviews if reviews is not None else card.review_count
    if reviews is None and rating is None:
        reviews = 0
    phone = P.strip_label(raw.get("phone_label")) or P.parse_phone_from_item_id(raw.get("phone_item_id"))
    price = raw.get("price")
    if price:
        price = P.strip_label(price.replace("Price:", "").strip())
    return Business(
        name=(raw.get("name") or (card.name if card else "") or "").strip(),
        category=raw.get("category"),
        address=P.strip_label(raw.get("address")),
        city=city,
        phone=phone,
        website=P.clean_website(raw.get("website")),
        rating=rating,
        review_count=reviews,
        price_level=price,
        plus_code=P.strip_label(raw.get("plus_code")),
        latitude=lat,
        longitude=lng,
        opening_hours=P.parse_hours(raw.get("hours_label")),
        is_claimed=False if raw.get("unclaimed") else True,
        permanently_closed=bool(raw.get("permanently_closed")),
        temporarily_closed=bool(raw.get("temporarily_closed")),
        maps_url=(card.url if card else url),
        place_id=P.parse_place_id(card.url if card else url) or P.parse_place_id(url),
        search_query=query,
    )


ProgressCb = Callable[[str, dict], Awaitable[None] | None]


class GoogleMapsScraper:
    def __init__(self, options: ScrapeOptions | None = None):
        self.opt = options or ScrapeOptions()
        self._pw = None
        self._browser: Browser | None = None
        self._ctx: BrowserContext | None = None

    async def __aenter__(self) -> "GoogleMapsScraper":
        self._pw = await async_playwright().start()
        launch_kwargs: dict = {"headless": self.opt.headless, "args": ["--lang=en-US"]}
        path = self.opt.browser_path or os.environ.get("CHROMIUM_PATH")
        if path:
            launch_kwargs["executable_path"] = path
        if self.opt.proxy:
            launch_kwargs["proxy"] = {"server": self.opt.proxy}
        try:
            self._browser = await self._pw.chromium.launch(**launch_kwargs)
        except PlaywrightError as e:
            await self._pw.stop()
            raise RuntimeError(
                "Could not launch Chromium. Run `playwright install chromium`, or set "
                "CHROMIUM_PATH / --browser-path to an existing Chrome/Chromium binary.\n" + str(e)
            ) from e
        self._ctx = await self._browser.new_context(
            locale="en-US",
            viewport={"width": 1366, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
            ),
        )
        # Pre-set consent cookies; the click-through below is the fallback.
        await self._ctx.add_cookies([
            {"name": "SOCS", "value": "CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg",
             "domain": ".google.com", "path": "/"},
        ])
        # Don't download images/fonts/media: faster and lighter on Google.
        await self._ctx.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in {"image", "media", "font"}
            else route.continue_(),
        )
        return self

    async def __aexit__(self, *exc) -> None:
        if self._ctx:
            await self._ctx.close()
        if self._browser:
            await self._browser.close()
        if self._pw:
            await self._pw.stop()

    # ------------------------------------------------------------------ helpers
    async def _pause(self, factor: float = 1.0) -> None:
        await asyncio.sleep(random.uniform(self.opt.min_delay, self.opt.max_delay) * factor)

    async def _check_blocked(self, page: Page) -> None:
        if "/sorry/" in page.url or "unusual traffic" in (await page.content())[:20000].lower():
            raise BlockedError(
                "Google is showing a CAPTCHA / 'unusual traffic' page. Slow down "
                "(--min-delay/--max-delay, --concurrency 1), wait a while, or use --headful "
                "and solve it manually."
            )

    async def _accept_consent(self, page: Page) -> None:
        if "consent.google" not in page.url:
            return
        for label in ("Accept all", "Alle akzeptieren", "Tout accepter", "Accetta tutto",
                      "Aceptar todo", "Alles accepteren", "Aceitar tudo", "I agree"):
            btn = page.get_by_role("button", name=label)
            if await btn.count():
                await btn.first.click()
                await page.wait_for_load_state("domcontentloaded")
                return
        form_btn = page.locator("form[action*='consent'] button").last
        if await form_btn.count():
            await form_btn.click()
            await page.wait_for_load_state("domcontentloaded")

    async def _goto(self, page: Page, url: str) -> None:
        last: Exception | None = None
        for attempt in range(self.opt.retries):
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45_000)
                await self._accept_consent(page)
                await self._check_blocked(page)
                return
            except BlockedError:
                raise
            except (PlaywrightTimeout, PlaywrightError) as e:
                last = e
                await asyncio.sleep(2 ** attempt * 2)
        raise RuntimeError(f"Failed to load {url}: {last}")

    # ------------------------------------------------------------------ search
    async def collect_cards(self, query: str, on_progress: ProgressCb | None = None) -> list[Card]:
        assert self._ctx
        page = await self._ctx.new_page()
        try:
            await self._goto(page, MAPS_SEARCH.format(q=quote_plus(query)))
            try:
                await page.wait_for_selector(
                    'div[role="feed"], h1.DUwDvf, div[role="main"] h1', timeout=20_000
                )
            except PlaywrightTimeout:
                await self._check_blocked(page)
                return []

            # Query matched a single place: Maps jumps straight to its page.
            if "/maps/place/" in page.url and not await page.query_selector('div[role="feed"]'):
                name = await page.title()
                return [Card(name=name.replace(" - Google Maps", ""), url=page.url, rating=None, review_count=None)]

            stale_rounds = 0
            last_count = 0
            result: dict = {"cards": []}
            while True:
                result = await page.evaluate(CARDS_JS)
                n = len(result["cards"])
                if on_progress:
                    r = on_progress("scroll", {"query": query, "found": n})
                    if asyncio.iscoroutine(r):
                        await r
                if result["end"] or n >= self.opt.max_results_per_query:
                    break
                stale_rounds = stale_rounds + 1 if n == last_count else 0
                if stale_rounds >= 6:
                    break
                last_count = n
                await page.evaluate(
                    "() => { const f = document.querySelector('div[role=\"feed\"]');"
                    " if (f) f.scrollBy(0, f.scrollHeight); }"
                )
                await self._pause(0.7)
                await self._check_blocked(page)
            cards = [card_from_raw(c) for c in result["cards"]]
            return [c for c in cards if c.name][: self.opt.max_results_per_query]
        finally:
            await page.close()

    # ------------------------------------------------------------------ details
    async def scrape_place(self, page: Page, card: Card, *, city: str | None, query: str) -> Business:
        await self._goto(page, card.url)
        try:
            await page.wait_for_selector("h1", timeout=20_000)
            # Info rows render a moment after the title.
            await page.wait_for_selector(
                'button[data-item-id="address"], [data-item-id^="phone:tel:"], a[data-item-id="authority"]',
                timeout=6_000,
            )
        except PlaywrightTimeout:
            await self._check_blocked(page)
        raw = await page.evaluate(PLACE_JS)
        return business_from_raw(raw, city=city, query=query, card=card)

    async def search(
        self,
        category: str,
        city: str,
        spec: FilterSpec,
        *,
        limit: int | None = None,
        seen: set[str] | None = None,
        on_business: Callable[[Business, bool], None] | None = None,
        on_progress: ProgressCb | None = None,
    ) -> list[Business]:
        """Scrape one category+city. Returns businesses that pass `spec` (up to `limit`)."""
        query = f"{category} in {city}"
        seen = seen if seen is not None else set()
        cards = await self.collect_cards(query, on_progress)
        candidates = [c for c in cards if spec.card_may_match(c.rating, c.review_count)]
        if on_progress:
            r = on_progress("cards", {"query": query, "found": len(cards), "candidates": len(candidates)})
            if asyncio.iscoroutine(r):
                await r

        queue: asyncio.Queue[Card] = asyncio.Queue()
        for c in candidates:
            queue.put_nowait(c)
        matched: list[Business] = []
        stop = asyncio.Event()
        blocked: list[BlockedError] = []

        async def worker() -> None:
            assert self._ctx
            page = await self._ctx.new_page()
            try:
                while not stop.is_set():
                    try:
                        card = queue.get_nowait()
                    except asyncio.QueueEmpty:
                        return
                    try:
                        b = await self.scrape_place(page, card, city=city, query=query)
                    except BlockedError as e:
                        blocked.append(e)
                        stop.set()
                        return
                    except Exception as e:  # one bad listing shouldn't kill the run
                        if on_progress:
                            r = on_progress("error", {"name": card.name, "error": str(e)[:200]})
                            if asyncio.iscoroutine(r):
                                await r
                        continue
                    key = b.dedupe_key
                    if key in seen:
                        continue
                    seen.add(key)
                    ok = spec.matches(b)
                    if ok and not stop.is_set():
                        matched.append(b)
                        if limit is not None and len(matched) >= limit:
                            stop.set()
                    if on_business:
                        on_business(b, ok)
                    await self._pause()
            finally:
                await page.close()

        await asyncio.gather(*(worker() for _ in range(max(1, self.opt.concurrency))))
        if blocked and not matched:
            raise blocked[0]
        if blocked and on_progress:
            r = on_progress("blocked", {"error": str(blocked[0])})
            if asyncio.iscoroutine(r):
                await r
        return matched[:limit] if limit is not None else matched
