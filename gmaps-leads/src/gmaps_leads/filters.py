from __future__ import annotations

from dataclasses import dataclass

from .models import Business


@dataclass
class FilterSpec:
    min_reviews: int | None = None
    max_reviews: int | None = None
    min_rating: float | None = None
    max_rating: float | None = None
    website: bool | None = None  # True = must have, False = must NOT have, None = any
    has_phone: bool | None = None
    category_contains: list[str] | None = None
    category_excludes: list[str] | None = None
    exclude_closed: bool = True
    claimed: bool | None = None  # False = only unclaimed listings

    # ---- quick check on what a results-list card shows (rating + review count) ----
    def card_may_match(self, rating: float | None, review_count: int | None) -> bool:
        """Return False only when the card data already proves the business fails.

        Lets the scraper skip opening detail pages that can't match.
        """
        if review_count is not None:
            if self.min_reviews is not None and review_count < self.min_reviews:
                return False
            if self.max_reviews is not None and review_count > self.max_reviews:
                return False
        if rating is not None:
            if self.min_rating is not None and rating < self.min_rating:
                return False
            if self.max_rating is not None and rating > self.max_rating:
                return False
        elif self.min_rating is not None and review_count == 0:
            return False  # no reviews => no rating => can't satisfy a min rating
        return True

    # ---- full check against a scraped Business ----
    def matches(self, b: Business) -> bool:
        reviews = b.review_count if b.review_count is not None else 0
        if self.min_reviews is not None and reviews < self.min_reviews:
            return False
        if self.max_reviews is not None and reviews > self.max_reviews:
            return False
        if self.min_rating is not None and (b.rating is None or b.rating < self.min_rating):
            return False
        if self.max_rating is not None and b.rating is not None and b.rating > self.max_rating:
            return False
        if self.website is not None and b.has_website != self.website:
            return False
        if self.has_phone is not None and bool(b.phone) != self.has_phone:
            return False
        cat = (b.category or "").lower()
        if self.category_contains and not any(s.lower() in cat for s in self.category_contains):
            return False
        if self.category_excludes and any(s.lower() in cat for s in self.category_excludes):
            return False
        if self.exclude_closed and (b.permanently_closed or b.temporarily_closed):
            return False
        if self.claimed is not None and b.is_claimed is not None and b.is_claimed != self.claimed:
            return False
        return True

    def describe(self) -> str:
        parts = []
        if self.min_reviews is not None:
            parts.append(f"reviews ≥ {self.min_reviews}")
        if self.max_reviews is not None:
            parts.append(f"reviews ≤ {self.max_reviews}")
        if self.min_rating is not None:
            parts.append(f"rating ≥ {self.min_rating}")
        if self.max_rating is not None:
            parts.append(f"rating ≤ {self.max_rating}")
        if self.website is True:
            parts.append("has website")
        if self.website is False:
            parts.append("no website")
        if self.has_phone is True:
            parts.append("has phone")
        if self.has_phone is False:
            parts.append("no phone")
        if self.category_contains:
            parts.append("category ∋ " + "/".join(self.category_contains))
        if self.category_excludes:
            parts.append("category ∌ " + "/".join(self.category_excludes))
        if self.exclude_closed:
            parts.append("open only")
        if self.claimed is False:
            parts.append("unclaimed")
        if self.claimed is True:
            parts.append("claimed")
        return ", ".join(parts) or "none"


def apply_filters(businesses: list[Business], spec: FilterSpec) -> list[Business]:
    return [b for b in businesses if spec.matches(b)]
