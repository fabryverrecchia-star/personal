from __future__ import annotations

import csv
import json
from pathlib import Path

from .models import Business

CSV_COLUMNS = [
    "name", "category", "address", "city", "phone", "website", "has_website",
    "rating", "review_count", "price_level", "plus_code", "latitude", "longitude",
    "opening_hours", "is_claimed", "permanently_closed", "temporarily_closed",
    "maps_url", "place_id", "search_query", "scraped_at",
]


def write_csv(businesses: list[Business], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as f:  # BOM so Excel reads UTF-8
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for b in businesses:
            w.writerow(b.model_dump(mode="json"))
    return path


def write_json(businesses: list[Business], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps([b.model_dump(mode="json") for b in businesses], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return path


def load_businesses(path: Path) -> list[Business]:
    """Load a previous run from .json, .jsonl or .csv."""
    suffix = path.suffix.lower()
    if suffix == ".json":
        return [Business.model_validate(d) for d in json.loads(path.read_text(encoding="utf-8"))]
    if suffix == ".jsonl":
        return [
            Business.model_validate_json(line)
            for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
    if suffix == ".csv":
        out = []
        with path.open(encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                row.pop("has_website", None)
                clean = {k: (v if v != "" else None) for k, v in row.items()}
                for k in ("permanently_closed", "temporarily_closed"):
                    clean[k] = (clean.get(k) or "").lower() == "true"
                if clean.get("is_claimed") is not None:
                    clean["is_claimed"] = clean["is_claimed"].lower() == "true"
                if clean.get("scraped_at") is None:
                    clean.pop("scraped_at", None)
                out.append(Business.model_validate(clean))
        return out
    raise ValueError(f"Unsupported file type: {path}")


class JsonlSink:
    """Append each scraped business to disk immediately so a crash/block loses nothing."""

    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self._f = path.open("a", encoding="utf-8")

    def write(self, b: Business) -> None:
        self._f.write(b.model_dump_json() + "\n")
        self._f.flush()

    def close(self) -> None:
        self._f.close()
