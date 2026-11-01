from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field, computed_field


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


class Business(BaseModel):
    """One Google Maps listing, normalised."""

    name: str
    category: str | None = None
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    website: str | None = None
    rating: float | None = None
    review_count: int | None = None
    price_level: str | None = None
    plus_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    opening_hours: str | None = None
    is_claimed: bool | None = None
    permanently_closed: bool = False
    temporarily_closed: bool = False
    maps_url: str | None = None
    place_id: str | None = None
    search_query: str | None = None
    scraped_at: datetime = Field(default_factory=_now)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def has_website(self) -> bool:
        return bool(self.website)

    @property
    def dedupe_key(self) -> str:
        return self.place_id or self.maps_url or f"{self.name}|{self.address}"
