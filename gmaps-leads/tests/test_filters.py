from gmaps_leads.filters import FilterSpec, apply_filters
from gmaps_leads.models import Business


def biz(**kw):
    kw.setdefault("name", "X")
    return Business(**kw)


def test_reviews_and_rating():
    spec = FilterSpec(min_reviews=10, max_reviews=100, min_rating=4.0)
    assert spec.matches(biz(review_count=50, rating=4.5))
    assert not spec.matches(biz(review_count=5, rating=4.5))
    assert not spec.matches(biz(review_count=500, rating=4.5))
    assert not spec.matches(biz(review_count=50, rating=3.9))
    assert not spec.matches(biz(review_count=50, rating=None))


def test_missing_reviews_count_as_zero():
    assert FilterSpec(max_reviews=10).matches(biz(review_count=None))
    assert not FilterSpec(min_reviews=1).matches(biz(review_count=None))


def test_website_phone():
    assert FilterSpec(website=False).matches(biz())
    assert not FilterSpec(website=False).matches(biz(website="https://a.example"))
    assert FilterSpec(website=True).matches(biz(website="https://a.example"))
    assert not FilterSpec(has_phone=True).matches(biz())


def test_category_closed_claimed():
    spec = FilterSpec(category_contains=["dent"], category_excludes=["lab"])
    assert spec.matches(biz(category="Cosmetic dentist"))
    assert not spec.matches(biz(category="Dental laboratory"))
    assert not spec.matches(biz(category="Plumber"))
    assert not FilterSpec().matches(biz(permanently_closed=True))
    assert FilterSpec(exclude_closed=False).matches(biz(temporarily_closed=True))
    assert FilterSpec(claimed=False).matches(biz(is_claimed=False))
    assert not FilterSpec(claimed=False).matches(biz(is_claimed=True))


def test_card_prefilter():
    spec = FilterSpec(max_reviews=50, min_rating=4)
    assert not spec.card_may_match(4.5, 200)
    assert not spec.card_may_match(3.5, 10)
    assert spec.card_may_match(None, None)  # unknown => must open the page
    assert not spec.card_may_match(None, 0)  # no reviews can't meet min rating
    assert FilterSpec(website=False).card_may_match(4.9, 9999)


def test_apply_filters():
    data = [biz(name="a", review_count=3), biz(name="b", review_count=300)]
    assert [b.name for b in apply_filters(data, FilterSpec(max_reviews=10))] == ["a"]
