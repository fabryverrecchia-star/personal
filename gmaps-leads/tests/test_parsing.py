from gmaps_leads import parsing as P


def test_parse_count():
    assert P.parse_count("1,234") == 1234
    assert P.parse_count("(1.234)") == 1234
    assert P.parse_count("1.2K") == 1200
    assert P.parse_count("23 reviews") == 23
    assert P.parse_count("No reviews") == 0
    assert P.parse_count("1 234 avis") == 1234
    assert P.parse_count(None) is None
    assert P.parse_count("reviews") is None


def test_parse_rating():
    assert P.parse_rating("4.6") == 4.6
    assert P.parse_rating("4,6") == 4.6
    assert P.parse_rating("4.6 stars") == 4.6
    assert P.parse_rating("5") == 5.0
    assert P.parse_rating("") is None


def test_parse_stars_label():
    assert P.parse_stars_label("4.6 stars 1,234 Reviews") == (4.6, 1234)
    assert P.parse_stars_label("5.0 stars 1 Review") == (5.0, 1)
    assert P.parse_stars_label("No reviews") == (None, 0)
    assert P.parse_stars_label(None) == (None, None)


def test_strip_label():
    assert P.strip_label("Address: 1 Main St, Austin ") == "1 Main St, Austin"
    assert P.strip_label("Phone: (512) 555-0123 ") == "(512) 555-0123"
    assert P.strip_label(" 1 Main St") == "1 Main St"
    assert P.strip_label("Plumber") == "Plumber"


def test_clean_website():
    assert P.clean_website("https://www.google.com/url?q=https://acme.example/&opi=1") == "https://acme.example/"
    assert P.clean_website("/url?q=http://x.example") == "http://x.example"
    assert P.clean_website("https://acme.example") == "https://acme.example"
    assert P.clean_website("javascript:void(0)") is None


def test_parse_coords_and_place_id():
    url = ("https://www.google.com/maps/place/Acme/data=!4m7!3m6!1s0x8644b5a0b0b0b0b1:0x1111111111111111"
           "!8m2!3d30.2672!4d-97.7431!16s%2Fg%2F11a!19sChIJAAAAAAAAAAAAAAAAAAAAAA1?hl=en")
    assert P.parse_coords(url) == (30.2672, -97.7431)
    assert P.parse_place_id(url) == "ChIJAAAAAAAAAAAAAAAAAAAAAA1"
    assert P.parse_place_id("https://www.google.com/maps/place/X/data=!1s0xabc:0xdef!8m2") == "0xabc:0xdef"
    assert P.parse_coords("https://www.google.com/maps/place/X/@30.1,-97.2,17z") == (30.1, -97.2)


def test_parse_hours():
    label = "Monday, 9 AM to 5 PM; Tuesday, Closed. Hide open hours for the week"
    assert P.parse_hours(label) == "Monday: 9 AM to 5 PM\nTuesday: Closed"


def test_phone_from_item_id():
    assert P.parse_phone_from_item_id("phone:tel:+15125550123") == "+15125550123"
