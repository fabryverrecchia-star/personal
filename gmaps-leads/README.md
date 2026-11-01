# gmaps-leads

Find business leads on Google Maps by **city + category**, filter them (review count, rating,
no website, …), save them as CSV/JSON, and export them to a **new Airtable base**.

```bash
leads search --city "Austin, TX" --category "plumber" --max-reviews 50 --no-website --airtable
```

## Setup

Requires Python 3.10+.

```bash
cd gmaps-leads
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
playwright install chromium
cp .env.example .env    # then fill in your Airtable details
```

### Airtable

1. Create a Personal Access Token at <https://airtable.com/create/tokens> with these scopes:
   `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`.
   Under **Access**, add the workspace where lead bases should be created.
2. Find your **workspace ID** (it starts with `wsp`). Open the workspace on airtable.com and copy it from the URL.
3. Put both values in `.env`:
   ```
   AIRTABLE_TOKEN=pat...
   AIRTABLE_WORKSPACE_ID=wsp...
   ```

Each `--airtable` run creates a new base named like `Leads – plumber – Austin, TX – 2026-11-01`
with one **Leads** table:

| Field | Type | Field | Type |
|---|---|---|---|
| Name (primary) | text | Google Maps URL | URL |
| Category | text | Place ID | text |
| Address | text | Latitude / Longitude | number |
| City | text | Plus Code | text |
| Phone | phone | Opening Hours | long text |
| Website | URL | Claimed | checkbox |
| Has Website | checkbox | Search Query | text |
| Rating | number (1 dp) | Scraped At | date/time |
| Reviews | number | **Status** | single select: New / Contacted / Qualified / Not interested / Won |
| Price Level | text | **Notes** | long text |

`Status` and `Notes` are for your own outreach tracking. To add leads to an existing base
instead, pass `--airtable-base appXXXXXXXX`. The table is created if it doesn't exist,
missing fields are added, and leads already in the table (same Place ID or Maps URL) are skipped.

## Usage

```bash
# Dentists in Milan with fewer than 30 reviews and no website, max 50 leads, pushed to Airtable
leads search -c "Milan" -k "dentist" --max-reviews 30 --no-website -n 50 --airtable

# Several categories × cities in one run (results are de-duplicated)
leads search -c "Austin, TX" -c "Round Rock, TX" -k "roofer" -k "roofing contractor" \
  --min-rating 4 --has-phone

# Well-reviewed restaurants that HAVE a website, excluding pizza places
leads search -c "Lyon" -k "restaurant" --min-reviews 200 --has-website --category-excludes pizza

# Unclaimed listings (owner never claimed their Google profile), watch the browser work
leads search -c "Denver" -k "auto repair" --unclaimed --headful

# Re-filter or export an earlier scrape without scraping again
leads export output/leads-dentist-milan-20261101-101500.all.jsonl --max-reviews 10 --airtable
leads export output/leads-....json --airtable-dry-run   # print the Airtable schema, no API calls
```

### Filters

| Flag | Meaning |
|---|---|
| `--min-reviews N` / `--max-reviews N` | Number of Google reviews (no reviews counts as 0) |
| `--min-rating X` / `--max-rating X` | Google star rating (0–5) |
| `--no-website` / `--has-website` | Website listed on the profile |
| `--has-phone` / `--no-phone` | Phone number listed |
| `--category-contains TEXT` | Category must contain TEXT (repeatable, any match) |
| `--category-excludes TEXT` | Drop categories containing TEXT (repeatable) |
| `--unclaimed` / `--claimed` | Whether the owner has claimed the listing |
| `--include-closed` | Keep permanently/temporarily closed places (dropped by default) |
| `--limit N` | Stop once N matching leads are found |

Rating and review count show up in the results list, so listings that already fail those
filters are skipped without opening their pages. That makes review-based searches much faster.

### Output

Every run writes to `output/` (change it with `--out-dir`):

- `leads-<category>-<city>-<time>.csv`: filtered leads (opens cleanly in Excel / Google Sheets)
- `….json`: the same leads as JSON
- `….all.jsonl`: **every** listing opened, before filtering. It is written as the run goes, so
  nothing is lost if the run crashes or gets blocked. Re-filter it later with `leads export`.

### Speed and scraper options

| Flag | Default | |
|---|---|---|
| `--concurrency` | 2 | listing pages open at once |
| `--min-delay` / `--max-delay` | 1 / 3 s | random pause between page loads |
| `--max-results` | 120 | listings scanned per search (Maps rarely shows more than ~120) |
| `--headful` | off | show the browser window |
| `--proxy` | — | `http://user:pass@host:port` |
| `--browser-path` | — | use an existing Chrome/Chromium (or set `CHROMIUM_PATH`) |

To get more than ~120 results for one area, split the search into neighbourhoods or nearby
towns (`-c "Brooklyn, NY" -c "Queens, NY"`), or use close category variants.

## Things to know

- **Terms of Service.** Automated scraping of Google Maps is against Google's Terms of Service.
  Use the tool at a moderate pace and at your own risk. If you hit a CAPTCHA ("unusual traffic"),
  the run stops, saves what it has, and tells you. Wait a while, lower `--concurrency`, raise the
  delays, or rerun with `--headful` and solve the CAPTCHA yourself.
- **Markup changes.** Google changes Maps' HTML from time to time. All selectors are in two
  JavaScript snippets at the top of `src/gmaps_leads/scraper.py` (`CARDS_JS`, `PLACE_JS`). They
  rely mostly on `aria-label` and `data-item-id` attributes, which change less often than class
  names. If a field suddenly comes back empty, look there first.
- **Language.** The scraper requests English (`hl=en`) so labels like "Permanently closed"
  parse the same everywhere. Addresses keep their local format.
- **Personal data and outreach rules.** If you contact these leads, follow the rules where you
  operate (GDPR in the EU, CAN-SPAM and TCPA in the US, and similar).

## Development

```bash
pip install -e '.[dev]'
pytest
```

`tests/test_scraper.py` runs the real scraper in Chromium against HTML fixtures in
`tests/fixtures/` that copy the structure of Maps pages, with the network intercepted.
Parsing, filters, file export and the Airtable client (mocked HTTP) have their own tests.

```
src/gmaps_leads/
  cli.py        # `leads search` / `leads export`
  scraper.py    # Playwright scraper + JS extractors
  parsing.py    # string → value helpers (counts, ratings, URLs, hours…)
  filters.py    # FilterSpec
  models.py     # Business model
  export.py     # CSV / JSON / JSONL
  airtable.py   # base/table creation + batched inserts
```
