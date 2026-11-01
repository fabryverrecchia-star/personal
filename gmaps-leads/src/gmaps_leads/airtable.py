"""Airtable export: create a new base with a typed `Leads` table, then insert records.

Uses the Airtable Web API with a Personal Access Token (https://airtable.com/create/tokens).
Required scopes: data.records:write, schema.bases:write (+ data.records:read and
schema.bases:read when appending to an existing base).
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Callable

import httpx

from .models import Business

API = "https://api.airtable.com/v0"
BATCH = 10  # Airtable max records per create request
MIN_INTERVAL = 0.22  # stay under 5 requests/second per base

STATUS_CHOICES = ["New", "Contacted", "Qualified", "Not interested", "Won"]


def _dt(b: Business) -> str:
    return b.scraped_at.strftime("%Y-%m-%dT%H:%M:%S.000Z")


# (field name, Airtable type, options, value getter). First entry is the primary field.
FIELDS: list[tuple[str, str, dict | None, Callable[[Business], Any]]] = [
    ("Name", "singleLineText", None, lambda b: b.name),
    ("Category", "singleLineText", None, lambda b: b.category),
    ("Address", "singleLineText", None, lambda b: b.address),
    ("City", "singleLineText", None, lambda b: b.city),
    ("Phone", "phoneNumber", None, lambda b: b.phone),
    ("Website", "url", None, lambda b: b.website),
    ("Has Website", "checkbox", {"icon": "check", "color": "greenBright"}, lambda b: b.has_website),
    ("Rating", "number", {"precision": 1}, lambda b: b.rating),
    ("Reviews", "number", {"precision": 0}, lambda b: b.review_count),
    ("Price Level", "singleLineText", None, lambda b: b.price_level),
    ("Google Maps URL", "url", None, lambda b: b.maps_url),
    ("Place ID", "singleLineText", None, lambda b: b.place_id),
    ("Latitude", "number", {"precision": 6}, lambda b: b.latitude),
    ("Longitude", "number", {"precision": 6}, lambda b: b.longitude),
    ("Plus Code", "singleLineText", None, lambda b: b.plus_code),
    ("Opening Hours", "multilineText", None, lambda b: b.opening_hours),
    ("Claimed", "checkbox", {"icon": "check", "color": "blueBright"}, lambda b: bool(b.is_claimed)),
    ("Search Query", "singleLineText", None, lambda b: b.search_query),
    ("Scraped At", "dateTime", {
        "dateFormat": {"name": "iso"},
        "timeFormat": {"name": "24hour"},
        "timeZone": "client",
    }, _dt),
    ("Status", "singleSelect", {"choices": [{"name": c} for c in STATUS_CHOICES]}, lambda b: "New"),
    ("Notes", "multilineText", None, lambda b: None),
]


def table_schema(name: str = "Leads") -> dict:
    fields = []
    for fname, ftype, opts, _ in FIELDS:
        f: dict[str, Any] = {"name": fname, "type": ftype}
        if opts:
            f["options"] = opts
        fields.append(f)
    return {"name": name, "description": "Leads scraped from Google Maps", "fields": fields}


def business_to_fields(b: Business) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for fname, ftype, _, get in FIELDS:
        v = get(b)
        if v is None or v == "":
            continue
        if ftype == "checkbox" and not v:
            continue  # Airtable stores unchecked as absent
        out[fname] = v
    return out


class AirtableError(RuntimeError):
    pass


@dataclass
class ExportResult:
    base_id: str
    table_id: str
    created: int
    skipped_duplicates: int

    @property
    def url(self) -> str:
        return f"https://airtable.com/{self.base_id}/{self.table_id}"


class AirtableClient:
    def __init__(self, token: str, *, client: httpx.Client | None = None, sleep=time.sleep):
        if not token:
            raise AirtableError("Missing Airtable token (set AIRTABLE_TOKEN or pass --airtable-token).")
        self._http = client or httpx.Client(timeout=30)
        self._headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self._sleep = sleep
        self._last = 0.0

    def _request(self, method: str, path: str, **kw) -> dict:
        for attempt in range(6):
            wait = MIN_INTERVAL - (time.monotonic() - self._last)
            if wait > 0:
                self._sleep(wait)
            self._last = time.monotonic()
            r = self._http.request(method, f"{API}{path}", headers=self._headers, **kw)
            if r.status_code == 429:
                self._sleep(30)  # Airtable asks clients to wait 30s after a 429
                continue
            if r.status_code >= 500:
                self._sleep(2 ** attempt)
                continue
            if r.status_code >= 400:
                raise AirtableError(f"Airtable {method} {path} -> {r.status_code}: {r.text[:500]}")
            return r.json() if r.content else {}
        raise AirtableError(f"Airtable {method} {path}: gave up after retries")

    # ---- schema
    def create_base(self, workspace_id: str, name: str, table_name: str = "Leads") -> tuple[str, str]:
        if not workspace_id:
            raise AirtableError(
                "Missing Airtable workspace ID (set AIRTABLE_WORKSPACE_ID or pass --airtable-workspace). "
                "It starts with 'wsp' and is in the URL when you open the workspace."
            )
        data = self._request("POST", "/meta/bases", json={
            "name": name, "workspaceId": workspace_id, "tables": [table_schema(table_name)],
        })
        return data["id"], data["tables"][0]["id"]

    def list_tables(self, base_id: str) -> list[dict]:
        return self._request("GET", f"/meta/bases/{base_id}/tables").get("tables", [])

    def ensure_table(self, base_id: str, table_name: str = "Leads") -> str:
        for t in self.list_tables(base_id):
            if t["name"] == table_name or t["id"] == table_name:
                existing = {f["name"] for f in t.get("fields", [])}
                for f in table_schema(table_name)["fields"]:
                    if f["name"] not in existing:
                        self._request("POST", f"/meta/bases/{base_id}/tables/{t['id']}/fields", json=f)
                return t["id"]
        data = self._request("POST", f"/meta/bases/{base_id}/tables", json=table_schema(table_name))
        return data["id"]

    # ---- records
    def existing_keys(self, base_id: str, table_id: str) -> set[str]:
        keys: set[str] = set()
        params: dict[str, Any] = {"fields[]": ["Place ID", "Google Maps URL"], "pageSize": 100}
        while True:
            data = self._request("GET", f"/{base_id}/{table_id}", params=params)
            for rec in data.get("records", []):
                f = rec.get("fields", {})
                for k in ("Place ID", "Google Maps URL"):
                    if f.get(k):
                        keys.add(f[k])
            if not data.get("offset"):
                return keys
            params["offset"] = data["offset"]

    def create_records(self, base_id: str, table_id: str, businesses: list[Business],
                       on_batch: Callable[[int], None] | None = None) -> int:
        created = 0
        for i in range(0, len(businesses), BATCH):
            chunk = businesses[i:i + BATCH]
            self._request("POST", f"/{base_id}/{table_id}", json={
                "records": [{"fields": business_to_fields(b)} for b in chunk],
                "typecast": True,
            })
            created += len(chunk)
            if on_batch:
                on_batch(created)
        return created


def export_to_airtable(
    businesses: list[Business],
    *,
    token: str,
    workspace_id: str | None = None,
    base_id: str | None = None,
    base_name: str = "Google Maps Leads",
    table_name: str = "Leads",
    client: AirtableClient | None = None,
    on_batch: Callable[[int], None] | None = None,
) -> ExportResult:
    """Create a new base (default) or append to `base_id`, skipping duplicates when appending."""
    at = client or AirtableClient(token)
    skipped = 0
    if base_id:
        table_id = at.ensure_table(base_id, table_name)
        known = at.existing_keys(base_id, table_id)
        fresh = [b for b in businesses if not ({b.place_id, b.maps_url} - {None}) & known]
        skipped = len(businesses) - len(fresh)
        businesses = fresh
    else:
        base_id, table_id = at.create_base(workspace_id or "", base_name, table_name)
    created = at.create_records(base_id, table_id, businesses, on_batch)
    return ExportResult(base_id=base_id, table_id=table_id, created=created, skipped_duplicates=skipped)
