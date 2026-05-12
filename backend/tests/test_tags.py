"""POST /tags."""
from __future__ import annotations

import uuid


def test_create_tag_happy_path(client):
    name = f"test-{uuid.uuid4().hex[:6]}"
    response = client.post(
        "/tags", json={"name": name, "category": "technology"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == name
    assert body["category"] == "technology"
    # cleanup
    client.delete(f"/tags/{body['id']}") if False else None  # no delete endpoint; ok


def test_create_tag_duplicate_returns_409(client):
    name = f"dup-{uuid.uuid4().hex[:6]}"
    first = client.post("/tags", json={"name": name, "category": "interest"})
    assert first.status_code == 201
    second = client.post("/tags", json={"name": name, "category": "interest"})
    assert second.status_code == 409
    assert second.json()["detail"] == "Tag o tej nazwie już istnieje"


def test_create_tag_empty_name_returns_422(client):
    response = client.post("/tags", json={"name": "  ", "category": "interest"})
    # pydantic min_length=1 may catch this as 422, otherwise the strip-check
    # in the router returns 422 as well.
    assert response.status_code == 422


def test_create_tag_invalid_category_returns_422(client):
    response = client.post(
        "/tags", json={"name": f"x-{uuid.uuid4().hex[:6]}", "category": "bogus"}
    )
    assert response.status_code == 422
