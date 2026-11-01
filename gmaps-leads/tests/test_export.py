from gmaps_leads.export import load_businesses, write_csv, write_json
from gmaps_leads.models import Business


def test_roundtrip(tmp_path):
    data = [
        Business(name="Acme, Inc", rating=4.5, review_count=10, website="https://a.example", is_claimed=True),
        Business(name="Bob", permanently_closed=True, is_claimed=False),
    ]
    for p in (write_csv(data, tmp_path / "x.csv"), write_json(data, tmp_path / "x.json")):
        back = load_businesses(p)
        assert [b.name for b in back] == ["Acme, Inc", "Bob"]
        assert back[0].rating == 4.5 and back[0].review_count == 10 and back[0].has_website
        assert back[1].permanently_closed and back[1].is_claimed is False
