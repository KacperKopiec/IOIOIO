def test_list_companies_paginated(client):
    response = client.get("/companies", params={"page_size": 5})
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload and "meta" in payload
    assert payload["meta"]["page_size"] == 5
    assert len(payload["items"]) <= 5


def test_filter_by_q(client):
    response = client.get("/companies", params={"q": "Comarch"})
    assert response.status_code == 200
    names = [row["name"] for row in response.json()["items"]]
    assert "Comarch" in names


def test_create_and_delete_company(client, unique_slug):
    payload = {
        "name": f"Test Sp. z o.o. {unique_slug}",
        "city": "Kraków",
        "company_size": "sme",
    }
    created = client.post("/companies", json=payload).json()
    assert created["id"] > 0
    deleted = client.delete(f"/companies/{created['id']}")
    assert deleted.status_code == 204


def test_invalid_company_size_returns_422(client):
    response = client.post(
        "/companies", json={"name": "x", "company_size": "mega-corp"}
    )
    assert response.status_code == 422
