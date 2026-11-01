import json

import httpx

from gmaps_leads.airtable import AirtableClient, business_to_fields, export_to_airtable, table_schema
from gmaps_leads.models import Business


def make_client(handler):
    calls = []

    def wrapped(request: httpx.Request):
        calls.append(request)
        return handler(request)

    http = httpx.Client(transport=httpx.MockTransport(wrapped))
    return AirtableClient("tok", client=http, sleep=lambda s: None), calls


def leads(n):
    return [Business(name=f"B{i}", place_id=f"ChIJ{i}", review_count=i, website=None) for i in range(n)]


def test_schema_and_fields():
    schema = table_schema()
    names = [f["name"] for f in schema["fields"]]
    assert names[0] == "Name" and "Google Maps URL" in names and "Status" in names
    f = business_to_fields(Business(name="A", rating=4.2, review_count=7, website="https://a.example"))
    assert f["Name"] == "A" and f["Rating"] == 4.2 and f["Reviews"] == 7
    assert f["Has Website"] is True and f["Status"] == "New"
    assert set(f) <= set(names)


def test_create_base_and_batches():
    def handler(req):
        if req.url.path == "/v0/meta/bases":
            body = json.loads(req.content)
            assert body["workspaceId"] == "wspX" and body["tables"][0]["name"] == "Leads"
            return httpx.Response(200, json={"id": "appNEW", "tables": [{"id": "tblL"}]})
        assert req.url.path == "/v0/appNEW/tblL"
        assert req.headers["Authorization"] == "Bearer tok"
        assert len(json.loads(req.content)["records"]) <= 10
        return httpx.Response(200, json={"records": []})

    client, calls = make_client(handler)
    res = export_to_airtable(leads(23), token="tok", workspace_id="wspX", base_name="B", client=client)
    assert res.base_id == "appNEW" and res.created == 23
    assert len(calls) == 1 + 3
    assert res.url == "https://airtable.com/appNEW/tblL"


def test_append_skips_duplicates_and_retries_429():
    state = {"429": 0}

    def handler(req):
        p = req.url.path
        if p == "/v0/meta/bases/appOLD/tables":
            return httpx.Response(200, json={"tables": [{"id": "tblL", "name": "Leads", "fields": [
                {"name": f["name"]} for f in table_schema()["fields"]]}]})
        if req.method == "GET" and p == "/v0/appOLD/tblL":
            return httpx.Response(200, json={"records": [{"fields": {"Place ID": "ChIJ0"}}]})
        if req.method == "POST" and p == "/v0/appOLD/tblL":
            if not state["429"]:
                state["429"] += 1
                return httpx.Response(429, json={})
            assert [r["fields"]["Name"] for r in json.loads(req.content)["records"]] == ["B1", "B2"]
            return httpx.Response(200, json={"records": []})
        raise AssertionError(p)

    client, _ = make_client(handler)
    res = export_to_airtable(leads(3), token="tok", base_id="appOLD", client=client)
    assert res.created == 2 and res.skipped_duplicates == 1 and state["429"] == 1


def test_error_surfaces():
    client, _ = make_client(lambda r: httpx.Response(403, json={"error": "INVALID_PERMISSIONS"}))
    try:
        client.create_base("wspX", "B")
    except Exception as e:
        assert "403" in str(e)
    else:
        raise AssertionError("expected error")
