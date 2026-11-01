"""Pure helpers that turn raw strings scraped from Google Maps into typed values.

Kept free of Playwright so they are easy to unit-test.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, unquote, urlparse

_NUM_RE = re.compile(r"(\d+(?:[.,   ]\d+)*)\s*([KkMm])?")


def parse_count(text: str | None) -> int | None:
    """'1,234' / '(1.234)' / '1.2K' / '12 reviews' -> int."""
    if not text:
        return None
    if re.search(r"\bno reviews\b", text, re.I):
        return 0
    m = _NUM_RE.search(text)
    if not m:
        return None
    raw, suffix = m.group(1), m.group(2)
    if suffix:
        value = float(raw.replace(",", ".").replace(" ", "").replace(" ", ""))
        return int(round(value * (1_000 if suffix.lower() == "k" else 1_000_000)))
    digits = re.sub(r"\D", "", raw)
    return int(digits) if digits else None


def parse_rating(text: str | None) -> float | None:
    """'4.6' / '4,6' / '4.6 stars' -> 4.6 (only accepts 0-5)."""
    if not text:
        return None
    m = re.search(r"(\d(?:[.,]\d)?)", text)
    if not m:
        return None
    value = float(m.group(1).replace(",", "."))
    return value if 0 <= value <= 5 else None


def parse_stars_label(label: str | None) -> tuple[float | None, int | None]:
    """Result-card aria-label like '4.6 stars 1,234 Reviews' -> (4.6, 1234)."""
    if not label:
        return None, None
    if re.search(r"\bno reviews\b", label, re.I):
        return None, 0
    m = re.search(r"(\d(?:[.,]\d)?)\s*stars?\s*([\d.,  ]+[KkMm]?)?\s*reviews?", label, re.I)
    if not m:
        return parse_rating(label), None
    rating = parse_rating(m.group(1))
    count = parse_count(m.group(2)) if m.group(2) else None
    return rating, count


def strip_label(text: str | None) -> str | None:
    """'Address: 1 Main St ' -> '1 Main St'. Leaves unlabelled text alone."""
    if not text:
        return None
    text = text.strip()
    m = re.match(r"^(Address|Phone|Plus code|Website|Located in)\s*:\s*(.+)$", text, re.I | re.S)
    if m:
        text = m.group(2)
    # Drop leading private-use icon glyphs Maps puts in the visible text.
    text = re.sub(r"^[-\s]+", "", text).strip()
    return text or None


def clean_website(url: str | None) -> str | None:
    """Unwrap Google redirect links ('/url?q=https://...') and drop junk."""
    if not url:
        return None
    url = url.strip()
    parsed = urlparse(url)
    if parsed.path == "/url" and ("google." in parsed.netloc or not parsed.netloc):
        q = parse_qs(parsed.query).get("q") or parse_qs(parsed.query).get("url")
        if q:
            url = q[0]
    if not url.startswith(("http://", "https://")):
        return None
    return url


def parse_coords(url: str | None) -> tuple[float | None, float | None]:
    """Extract lat/lng from a Maps place URL ('!3d<lat>!4d<lng>', fallback '@lat,lng')."""
    if not url:
        return None, None
    m = re.search(r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)", url)
    if not m:
        m = re.search(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", url)
    if not m:
        return None, None
    return float(m.group(1)), float(m.group(2))


def parse_place_id(url: str | None) -> str | None:
    """Prefer the 'ChIJ…' Place ID ('!19s…'); fall back to the '0x…:0x…' feature id."""
    if not url:
        return None
    url = unquote(url)
    m = re.search(r"!19s(ChIJ[\w-]+)", url)
    if m:
        return m.group(1)
    m = re.search(r"!1s(0x[0-9a-f]+:0x[0-9a-f]+)", url, re.I)
    if m:
        return m.group(1)
    m = re.search(r"[?&]query_place_id=([\w-]+)", url)
    return m.group(1) if m else None


def parse_hours(label: str | None) -> str | None:
    """Weekly-hours aria-label -> one line per day.

    'Monday, 9 AM to 5 PM; Tuesday, Closed. Hide open hours for the week' ->
    'Monday: 9 AM to 5 PM\\nTuesday: Closed'
    """
    if not label:
        return None
    text = re.sub(r"[.\s]*(Hide|Show) open hours for the week\.?", "", label, flags=re.I)
    text = text.replace(" ", " ").replace(" ", " ")
    lines = []
    for part in text.split(";"):
        part = part.strip().rstrip(".")
        if not part:
            continue
        day, sep, rest = part.partition(",")
        lines.append(f"{day.strip()}: {rest.strip()}" if sep else part)
    return "\n".join(lines) or None


def parse_phone_from_item_id(item_id: str | None) -> str | None:
    """data-item-id='phone:tel:+15125551234' -> '+15125551234'."""
    if not item_id:
        return None
    m = re.match(r"phone:tel:(.+)", item_id)
    return m.group(1) if m else None
