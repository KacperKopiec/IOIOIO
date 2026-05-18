from __future__ import annotations

from datetime import date


def test_invoice_lifecycle_and_filters(client):
    companies = client.get("/companies", params={"page_size": 1}).json()["items"]
    events = client.get("/events", params={"page_size": 1}).json()["items"]
    assert companies and events

    payload = {
        "company_id": companies[0]["id"],
        "event_id": events[0]["id"],
        "invoice_number": f"FV-TEST-{date.today().isoformat()}",
        "amount": "1234.50",
        "currency": "PLN",
        "issue_date": date.today().isoformat(),
        "payment_status": "pending",
    }
    created = client.post("/invoices", json=payload)
    assert created.status_code == 201
    invoice = created.json()
    assert invoice["invoice_number"] == payload["invoice_number"]
    assert invoice["company_id"] == payload["company_id"]
    assert invoice["event_id"] == payload["event_id"]

    pending = client.get("/invoices", params={"payment_status": "pending"}).json()
    assert any(item["id"] == invoice["id"] for item in pending)

    paid = client.patch(
        f"/invoices/{invoice['id']}",
        json={"payment_status": "paid", "paid_at": date.today().isoformat()},
    )
    assert paid.status_code == 200
    assert paid.json()["payment_status"] == "paid"

    by_company = client.get(
        "/invoices", params={"company_id": payload["company_id"]}
    ).json()
    assert any(item["id"] == invoice["id"] for item in by_company)


def test_invalid_payment_status_returns_422(client):
    response = client.get("/invoices", params={"payment_status": "late"})
    assert response.status_code == 422
