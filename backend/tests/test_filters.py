"""Filter combinations on /companies and /events."""
from __future__ import annotations


# ----- /companies ---------------------------------------------------------


def test_companies_q_matches_name_legal_nip_city(client):
    """q should hit name/legal_name/nip/city. Comarch is in Kraków → both
    'comarch' and 'krak' should return it."""
    by_name = client.get("/companies", params={"q": "comarch"}).json()
    by_city = client.get("/companies", params={"q": "krak"}).json()
    assert any(c["name"] == "Comarch" for c in by_name["items"])
    assert any(c["city"] == "Kraków" for c in by_city["items"])


def test_companies_industry_filter_narrows_result(client):
    """Filtering by an industry that doesn't exist should narrow the result
    to zero; filtering by IT should keep at least Comarch."""
    industries = {i["name"]: i["id"] for i in client.get("/industries").json()}
    by_it = client.get(
        "/companies", params={"industry_id": industries["IT"]}
    ).json()
    assert any(c["name"] == "Comarch" for c in by_it["items"])


def test_companies_company_size_filter(client):
    body = client.get("/companies", params={"company_size": "corporation"}).json()
    assert all(c["company_size"] == "corporation" for c in body["items"])


def test_companies_invalid_company_size_returns_422(client):
    response = client.get("/companies", params={"company_size": "mega"})
    assert response.status_code == 422


def test_companies_tag_filter_csv_and_semantics(client):
    tags = {t["name"]: t["id"] for t in client.get("/tags").json()}
    sponsor = tags.get("sponsor")
    saas = tags.get("saas")
    assert sponsor and saas
    # AND semantics — only firms tagged with BOTH should be returned.
    both = client.get(
        "/companies", params={"tag_ids": f"{sponsor},{saas}"}
    ).json()
    for item in both["items"]:
        names = {t["name"] for t in item["tags"]}
        assert "sponsor" in names and "saas" in names


def test_companies_pagination_meta(client):
    page = client.get("/companies", params={"page": 1, "page_size": 5}).json()
    assert page["meta"]["page"] == 1
    assert page["meta"]["page_size"] == 5
    assert page["meta"]["total"] >= len(page["items"])
    assert page["meta"]["pages"] == max(
        1, -(-page["meta"]["total"] // page["meta"]["page_size"])
    )


# ----- /events ------------------------------------------------------------


def test_events_status_filter(client):
    body = client.get("/events", params={"status": "active"}).json()
    assert all(e["status"] == "active" for e in body["items"])


def test_events_owner_filter(client):
    coordinators = client.get("/users", params={"role": "koordynator"}).json()
    if not coordinators:
        return
    owner_id = coordinators[0]["id"]
    body = client.get("/events", params={"owner_user_id": owner_id}).json()
    for ev in body["items"]:
        assert ev["owner_user_id"] == owner_id


def test_events_tag_filter_csv_and_semantics(client):
    tags = {t["name"]: t["id"] for t in client.get("/tags").json()}
    sponsor = tags.get("sponsor")
    hackathon = tags.get("hackathon")
    assert sponsor and hackathon
    # Only the KrakHack event has both tags in the seed.
    body = client.get(
        "/events", params={"tag_ids": f"{sponsor},{hackathon}"}
    ).json()
    assert all(
        {"sponsor", "hackathon"} <= {t["name"] for t in e["tags"]}
        for e in body["items"]
    )


def test_events_bad_tag_token_returns_422(client):
    response = client.get("/events", params={"tag_ids": "not-an-int"})
    assert response.status_code == 422
