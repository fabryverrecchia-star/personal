"""Runs the real scraper (Chromium + JS extractors) against local fixtures that mimic Maps markup.

Network is intercepted, so no request reaches Google. Skipped if Chromium can't launch.
"""
import asyncio
import os
from pathlib import Path

import pytest

from gmaps_leads.filters import FilterSpec
from gmaps_leads.scraper import GoogleMapsScraper, ScrapeOptions

FIX = Path(__file__).parent / "fixtures"
PAGES = {
    "Acme+Plumbing": "place_acme.html",
    "Bob's+Pipes": "place_bobs.html",
    "Bob%27s+Pipes": "place_bobs.html",
    "New+Drain+Co": "place_newdrain.html",
    "Old+Leak+Fixers": "place_oldleak.html",
}


def browser_path():
    if os.environ.get("CHROMIUM_PATH"):
        return os.environ["CHROMIUM_PATH"]
    return "/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None


async def run(spec, limit=None):
    opts = ScrapeOptions(min_delay=0, max_delay=0.01, concurrency=2, browser_path=browser_path())
    try:
        scraper = await GoogleMapsScraper(opts).__aenter__()
    except RuntimeError as e:
        pytest.skip(f"Chromium unavailable: {e}")
    try:
        async def fulfill(route):
            url = route.request.url
            if "/maps/search/" in url:
                body = (FIX / "search_results.html").read_text()
            else:
                name = next((k for k in PAGES if f"/maps/place/{k}/" in url), None)
                if not name:
                    return await route.abort()
                body = (FIX / PAGES[name]).read_text()
            await route.fulfill(status=200, content_type="text/html", body=body)

        await scraper._ctx.route("**/*", fulfill)
        return await scraper.search("plumber", "Austin", spec, limit=limit)
    finally:
        await scraper.__aexit__(None, None, None)


def test_full_extraction():
    got = {b.name: b for b in asyncio.run(run(FilterSpec(exclude_closed=False)))}
    assert set(got) == {"Acme Plumbing", "Bob's Pipes", "New Drain Co", "Old Leak Fixers"}

    bob = got["Bob's Pipes"]
    assert bob.category == "Plumber"
    assert bob.address == "500 Congress Ave, Austin, TX 78701"
    assert bob.phone == "(512) 555-0123"
    assert bob.website is None and not bob.has_website
    assert bob.rating == 4.1 and bob.review_count == 23
    assert bob.price_level == "$$"
    assert bob.plus_code == "6PH5+2X Austin, Texas"
    assert bob.is_claimed is False
    assert bob.opening_hours.splitlines()[0] == "Monday: 8 AM to 6 PM"
    assert bob.place_id == "ChIJBBBBBBBBBBBBBBBBBBBBBB2"
    assert (bob.latitude, bob.longitude) == (30.3, -97.7)
    assert bob.city == "Austin" and bob.search_query == "plumber in Austin"

    acme = got["Acme Plumbing"]
    assert acme.website == "https://acmeplumbing.example/" and acme.review_count == 1234
    assert acme.is_claimed is True

    assert got["New Drain Co"].review_count == 0 and got["New Drain Co"].rating is None
    assert got["Old Leak Fixers"].permanently_closed


def test_filters_and_prefilter():
    # No website, ≤ 50 reviews, open: Bob's Pipes and New Drain Co (Acme pre-filtered by review count).
    names = sorted(b.name for b in asyncio.run(run(FilterSpec(max_reviews=50, website=False))))
    assert names == ["Bob's Pipes", "New Drain Co"]


def test_limit():
    assert len(asyncio.run(run(FilterSpec(exclude_closed=False), limit=1))) == 1
