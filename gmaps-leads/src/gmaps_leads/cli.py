from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

from .airtable import AirtableError, export_to_airtable, table_schema
from .export import JsonlSink, load_businesses, write_csv, write_json
from .filters import FilterSpec, apply_filters
from .models import Business

load_dotenv(Path.cwd() / ".env")  # before Typer reads AIRTABLE_* env vars

app = typer.Typer(add_completion=False, help="Find business leads on Google Maps and export them to Airtable.")
console = Console()


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


def _build_spec(min_reviews, max_reviews, min_rating, max_rating, no_website, has_website,
                has_phone, no_phone, category_contains, category_excludes, include_closed,
                unclaimed, claimed) -> FilterSpec:
    if no_website and has_website:
        raise typer.BadParameter("Use only one of --no-website / --has-website.")
    if has_phone and no_phone:
        raise typer.BadParameter("Use only one of --has-phone / --no-phone.")
    if unclaimed and claimed:
        raise typer.BadParameter("Use only one of --unclaimed / --claimed.")
    return FilterSpec(
        min_reviews=min_reviews, max_reviews=max_reviews,
        min_rating=min_rating, max_rating=max_rating,
        website=False if no_website else (True if has_website else None),
        has_phone=True if has_phone else (False if no_phone else None),
        category_contains=category_contains or None,
        category_excludes=category_excludes or None,
        exclude_closed=not include_closed,
        claimed=False if unclaimed else (True if claimed else None),
    )


def _summary_table(leads: list[Business], max_rows: int = 25) -> Table:
    t = Table(show_lines=False)
    for col in ("Name", "Category", "Rating", "Reviews", "Phone", "Website"):
        t.add_column(col, overflow="fold")
    for b in leads[:max_rows]:
        t.add_row(b.name, b.category or "", f"{b.rating:.1f}" if b.rating is not None else "–",
                  str(b.review_count if b.review_count is not None else "–"), b.phone or "",
                  (b.website or "")[:40])
    if len(leads) > max_rows:
        t.caption = f"… and {len(leads) - max_rows} more"
    return t


def _push_airtable(leads: list[Business], *, token, workspace, base, base_name, table, dry_run) -> None:
    if dry_run:
        console.print("[bold]Airtable dry run[/] — base schema that would be created:")
        console.print_json(json.dumps({"name": base_name, "workspaceId": workspace or "<workspace>",
                                       "tables": [table_schema(table)]}))
        return
    if not leads:
        console.print("[yellow]No leads to export to Airtable.[/]")
        return
    with console.status("Exporting to Airtable…") as status:
        res = export_to_airtable(
            leads, token=token or "", workspace_id=workspace, base_id=base,
            base_name=base_name, table_name=table,
            on_batch=lambda n: status.update(f"Exporting to Airtable… {n}/{len(leads)}"),
        )
    msg = f"[green]Airtable:[/] {res.created} records → {res.url}"
    if res.skipped_duplicates:
        msg += f" ({res.skipped_duplicates} duplicates skipped)"
    console.print(msg)


# Common options --------------------------------------------------------------------------
MinReviews = typer.Option(None, "--min-reviews", help="Keep businesses with at least N reviews.")
MaxReviews = typer.Option(None, "--max-reviews", help="Keep businesses with at most N reviews.")
MinRating = typer.Option(None, "--min-rating", help="Minimum Google rating (0–5).")
MaxRating = typer.Option(None, "--max-rating", help="Maximum Google rating (0–5).")
NoWebsite = typer.Option(False, "--no-website", help="Only businesses WITHOUT a website.")
HasWebsite = typer.Option(False, "--has-website", help="Only businesses WITH a website.")
HasPhone = typer.Option(False, "--has-phone", help="Only businesses with a phone number.")
NoPhone = typer.Option(False, "--no-phone", help="Only businesses without a phone number.")
CatContains = typer.Option(None, "--category-contains", help="Category must contain this text (repeatable).")
CatExcludes = typer.Option(None, "--category-excludes", help="Drop categories containing this text (repeatable).")
IncludeClosed = typer.Option(False, "--include-closed", help="Keep permanently/temporarily closed businesses.")
Unclaimed = typer.Option(False, "--unclaimed", help="Only listings the owner hasn't claimed.")
Claimed = typer.Option(False, "--claimed", help="Only owner-claimed listings.")
Airtable = typer.Option(False, "--airtable", help="Export the leads to Airtable.")
AirtableToken = typer.Option(None, "--airtable-token", envvar="AIRTABLE_TOKEN", help="Airtable personal access token.")
AirtableWs = typer.Option(None, "--airtable-workspace", envvar="AIRTABLE_WORKSPACE_ID", help="Workspace ID (wsp…) for the new base.")
AirtableBase = typer.Option(None, "--airtable-base", help="Append to this existing base (app…) instead of creating one.")
AirtableBaseName = typer.Option(None, "--airtable-base-name", help="Name for the new base.")
AirtableTable = typer.Option("Leads", "--airtable-table", help="Table name.")
DryRun = typer.Option(False, "--airtable-dry-run", help="Print the Airtable schema instead of calling the API.")


@app.command()
def search(
    city: list[str] = typer.Option(..., "--city", "-c", help="City to search in (repeatable)."),
    category: list[str] = typer.Option(..., "--category", "-k", help="Industry / category / keyword (repeatable)."),
    limit: Optional[int] = typer.Option(None, "--limit", "-n", help="Stop after this many matching leads (total)."),
    max_results: int = typer.Option(120, "--max-results", help="Max listings to scan per search (Maps shows ~120)."),
    min_reviews: Optional[int] = MinReviews, max_reviews: Optional[int] = MaxReviews,
    min_rating: Optional[float] = MinRating, max_rating: Optional[float] = MaxRating,
    no_website: bool = NoWebsite, has_website: bool = HasWebsite,
    has_phone: bool = HasPhone, no_phone: bool = NoPhone,
    category_contains: Optional[list[str]] = CatContains, category_excludes: Optional[list[str]] = CatExcludes,
    include_closed: bool = IncludeClosed, unclaimed: bool = Unclaimed, claimed: bool = Claimed,
    out_dir: Path = typer.Option(Path("output"), "--out-dir", "-o", help="Where CSV/JSON files are written."),
    headful: bool = typer.Option(False, "--headful", help="Show the browser window."),
    concurrency: int = typer.Option(2, "--concurrency", help="Listing pages opened in parallel."),
    min_delay: float = typer.Option(1.0, "--min-delay", help="Min seconds between page loads per tab."),
    max_delay: float = typer.Option(3.0, "--max-delay", help="Max seconds between page loads per tab."),
    browser_path: Optional[str] = typer.Option(None, "--browser-path", envvar="CHROMIUM_PATH", help="Chrome/Chromium binary."),
    proxy: Optional[str] = typer.Option(None, "--proxy", help="Proxy server, e.g. http://user:pass@host:port"),
    airtable: bool = Airtable, airtable_token: Optional[str] = AirtableToken,
    airtable_workspace: Optional[str] = AirtableWs, airtable_base: Optional[str] = AirtableBase,
    airtable_base_name: Optional[str] = AirtableBaseName, airtable_table: str = AirtableTable,
    airtable_dry_run: bool = DryRun,
) -> None:
    """Scrape Google Maps for CATEGORY in CITY, filter, save CSV/JSON, optionally push to Airtable."""
    from .scraper import BlockedError, GoogleMapsScraper, ScrapeOptions

    spec = _build_spec(min_reviews, max_reviews, min_rating, max_rating, no_website, has_website,
                       has_phone, no_phone, category_contains, category_excludes, include_closed,
                       unclaimed, claimed)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    stem = f"leads-{_slug('-'.join(category))}-{_slug('-'.join(city))}-{stamp}"
    raw_sink = JsonlSink(out_dir / f"{stem}.all.jsonl")
    console.print(f"[bold]Filters:[/] {spec.describe()}")

    opts = ScrapeOptions(headless=not headful, concurrency=concurrency, max_results_per_query=max_results,
                         min_delay=min_delay, max_delay=max_delay, browser_path=browser_path, proxy=proxy)
    leads: list[Business] = []
    stats = {"scraped": 0, "matched": 0}

    async def run() -> None:
        seen: set[str] = set()
        async with GoogleMapsScraper(opts) as scraper:
            with console.status("Starting…") as status:
                def on_progress(kind: str, d: dict) -> None:
                    if kind == "scroll":
                        status.update(f"[{d['query']}] scrolling results… {d['found']} listings")
                    elif kind == "cards":
                        console.print(f"[cyan]{d['query']}[/]: {d['found']} listings, "
                                      f"{d['candidates']} worth opening")
                    elif kind == "error":
                        console.print(f"  [yellow]skip[/] {d['name']}: {d['error']}")
                    elif kind == "blocked":
                        console.print(f"[red]{d['error']}[/]")

                def on_business(b: Business, ok: bool) -> None:
                    stats["scraped"] += 1
                    stats["matched"] += int(ok)
                    raw_sink.write(b)
                    status.update(f"opened {stats['scraped']} listings · {stats['matched']} leads "
                                  f"· last: {b.name[:40]}")

                for cat in category:
                    for c in city:
                        remaining = None if limit is None else limit - len(leads)
                        if remaining is not None and remaining <= 0:
                            return
                        leads.extend(await scraper.search(
                            cat, c, spec, limit=remaining, seen=seen,
                            on_business=on_business, on_progress=on_progress))

    try:
        asyncio.run(run())
    except BlockedError as e:
        console.print(f"[red]{e}[/]")
    except KeyboardInterrupt:
        console.print("[yellow]Interrupted — saving what was collected.[/]")
    except RuntimeError as e:
        console.print(f"[red]{e}[/]")
        raise typer.Exit(1)
    finally:
        raw_sink.close()

    console.print(f"Opened {stats['scraped']} listings → [bold green]{len(leads)} leads[/] matched.")
    if not leads:
        console.print(f"All scraped listings (unfiltered) saved in {raw_sink.path}")
        raise typer.Exit(0 if stats["scraped"] else 1)
    console.print(_summary_table(leads))
    csv_path = write_csv(leads, out_dir / f"{stem}.csv")
    json_path = write_json(leads, out_dir / f"{stem}.json")
    console.print(f"Saved {csv_path} and {json_path} (all scraped listings: {raw_sink.path})")

    if airtable or airtable_dry_run:
        name = airtable_base_name or f"Leads – {', '.join(category)} – {', '.join(city)} – {datetime.now():%Y-%m-%d}"
        try:
            _push_airtable(leads, token=airtable_token, workspace=airtable_workspace, base=airtable_base,
                           base_name=name, table=airtable_table, dry_run=airtable_dry_run)
        except AirtableError as e:
            console.print(f"[red]{e}[/]\nYour leads are safe in {csv_path}; retry with `leads export {json_path} --airtable`.")
            raise typer.Exit(1)


@app.command()
def export(
    file: Path = typer.Argument(..., exists=True, help="A .json/.jsonl/.csv file from a previous run."),
    min_reviews: Optional[int] = MinReviews, max_reviews: Optional[int] = MaxReviews,
    min_rating: Optional[float] = MinRating, max_rating: Optional[float] = MaxRating,
    no_website: bool = NoWebsite, has_website: bool = HasWebsite,
    has_phone: bool = HasPhone, no_phone: bool = NoPhone,
    category_contains: Optional[list[str]] = CatContains, category_excludes: Optional[list[str]] = CatExcludes,
    include_closed: bool = IncludeClosed, unclaimed: bool = Unclaimed, claimed: bool = Claimed,
    csv_out: Optional[Path] = typer.Option(None, "--csv", help="Also write the filtered leads to this CSV."),
    airtable: bool = Airtable, airtable_token: Optional[str] = AirtableToken,
    airtable_workspace: Optional[str] = AirtableWs, airtable_base: Optional[str] = AirtableBase,
    airtable_base_name: Optional[str] = AirtableBaseName, airtable_table: str = AirtableTable,
    airtable_dry_run: bool = DryRun,
) -> None:
    """Re-filter a saved scrape and/or push it to Airtable — no re-scraping needed."""
    spec = _build_spec(min_reviews, max_reviews, min_rating, max_rating, no_website, has_website,
                       has_phone, no_phone, category_contains, category_excludes, include_closed,
                       unclaimed, claimed)
    data = load_businesses(file)
    leads = apply_filters(data, spec)
    console.print(f"[bold]Filters:[/] {spec.describe()}\n{len(data)} loaded → [bold green]{len(leads)} leads[/]")
    if leads:
        console.print(_summary_table(leads))
    if csv_out:
        console.print(f"Saved {write_csv(leads, csv_out)}")
    if airtable or airtable_dry_run:
        name = airtable_base_name or f"Leads – {file.stem} – {datetime.now():%Y-%m-%d}"
        try:
            _push_airtable(leads, token=airtable_token, workspace=airtable_workspace, base=airtable_base,
                           base_name=name, table=airtable_table, dry_run=airtable_dry_run)
        except AirtableError as e:
            console.print(f"[red]{e}[/]")
            raise typer.Exit(1)


def main() -> None:  # pragma: no cover
    app()
