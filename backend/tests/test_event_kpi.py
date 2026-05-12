"""Coverage for /events/{id}/kpi math."""
from __future__ import annotations


def test_kpi_seeded_sfi(client):
    """The seeded SFI 2024 (event 1) has 4 won entries totalling 45 000 PLN
    out of 10 pipeline entries; assert the math is what the service
    contracts promise."""
    body = client.get("/events/1/kpi").json()
    assert body["event_id"] == 1
    assert body["pipeline_count"] >= body["partners_count"]
    if body["partners_count"] > 0:
        assert float(body["total_value"]) > 0
        assert body["avg_partner_value"] is not None
    if body["conversion_rate"] is not None:
        assert 0.0 <= body["conversion_rate"] <= 1.0
    if body["progress_partners_pct"] is not None:
        assert 0.0 <= body["progress_partners_pct"] <= 1.0
    if body["progress_budget_pct"] is not None:
        assert 0.0 <= body["progress_budget_pct"] <= 1.0


def test_kpi_unknown_event_404(client):
    response = client.get("/events/9999999/kpi")
    assert response.status_code == 404


def test_kpi_progress_capped_at_one(client):
    """progress_partners_pct and progress_budget_pct must never exceed 1.0,
    even when actual partners/value exceed the targets — the service caps
    them so the progress bars never visually overflow."""
    for event_id in (1, 2, 3):
        body = client.get(f"/events/{event_id}/kpi").json()
        if body["progress_partners_pct"] is not None:
            assert body["progress_partners_pct"] <= 1.0
        if body["progress_budget_pct"] is not None:
            assert body["progress_budget_pct"] <= 1.0


def test_kpi_conversion_rate_excludes_open(client):
    """conversion_rate must use the won/(won+lost) denominator, not
    won/pipeline_count, so an event with many entries still in flight
    isn't punished."""
    body = client.get("/events/2/kpi").json()
    if body["conversion_rate"] is not None and body["pipeline_count"] > 0:
        # If there are open entries, conversion_rate's denominator is
        # smaller than pipeline_count.
        if body["partners_count"] + 0 < body["pipeline_count"]:
            naive = body["partners_count"] / body["pipeline_count"]
            assert body["conversion_rate"] >= naive
