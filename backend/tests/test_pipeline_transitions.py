"""Tests for stage-transition rules in services/pipeline.py.

Touches a single pipeline entry (the first one on event 2) by moving
it through stages and asserting timestamps + side effects, then puts
it back so the rest of the test suite stays deterministic.
"""
from __future__ import annotations

import pytest


@pytest.fixture
def entry_and_stages(client):
    entries = client.get("/pipeline-entries", params={"event_id": 2, "stage_id": 1}).json()
    if not entries:
        pytest.skip("no Kontakt-stage entries on event 2 to exercise")
    entry = entries[0]
    stages = {s["name"]: s for s in client.get("/pipeline-stages").json()}
    return entry, stages


def _move(client, entry_id, stage_id, **payload):
    return client.post(f"/pipeline-entries/{entry_id}/move", json={"stage_id": stage_id, **payload})


def test_offer_sent_at_set_on_entry_into_oferta_wyslana(client, entry_and_stages):
    entry, stages = entry_and_stages
    initial_stage = entry["stage_id"]
    try:
        body = _move(client, entry["id"], stages["Oferta wysłana"]["id"]).json()
        assert body["offer_sent_at"] is not None
        assert body["stage_id"] == stages["Oferta wysłana"]["id"]
    finally:
        _move(client, entry["id"], initial_stage)


def test_first_contact_at_set_when_leaving_kontakt(client, entry_and_stages):
    entry, stages = entry_and_stages
    initial_stage = entry["stage_id"]
    try:
        body = _move(client, entry["id"], stages["Negocjacje"]["id"]).json()
        assert body["first_contact_at"] is not None
    finally:
        _move(client, entry["id"], initial_stage)


def test_won_sets_closed_at_and_creates_draft_relationship(client, entry_and_stages):
    entry, stages = entry_and_stages
    initial_stage = entry["stage_id"]
    try:
        body = _move(
            client,
            entry["id"],
            stages["Decyzja: TAK"]["id"],
            agreed_amount="12345",
        ).json()
        assert body["stage_id"] == stages["Decyzja: TAK"]["id"]
        assert body["closed_at"] is not None
        assert body["agreed_amount"] == "12345.00"

        rels = client.get(
            "/company-relationships",
            params={"company_id": entry["company_id"]},
        ).json()
        relevant = [r for r in rels if r["pipeline_entry_id"] == entry["id"]]
        assert len(relevant) == 1
        assert relevant[0]["status"] == "draft"
    finally:
        _move(client, entry["id"], initial_stage)
        # Drop the draft relationship so other tests don't see it.
        rels = client.get(
            "/company-relationships",
            params={"company_id": entry["company_id"]},
        ).json()
        for r in rels:
            if r["pipeline_entry_id"] == entry["id"]:
                client.delete(f"/company-relationships/{r['id']}")


def test_lost_sets_closed_at_and_stores_rejection(client, entry_and_stages):
    entry, stages = entry_and_stages
    initial_stage = entry["stage_id"]
    try:
        body = _move(
            client,
            entry["id"],
            stages["Odrzucony"]["id"],
            rejection_reason="Brak budżetu",
        ).json()
        assert body["closed_at"] is not None
        assert body["rejection_reason"] == "Brak budżetu"
    finally:
        _move(client, entry["id"], initial_stage)


def test_revert_to_open_stage_clears_closed_at_and_rejection(client, entry_and_stages):
    entry, stages = entry_and_stages
    initial_stage = entry["stage_id"]
    try:
        _move(
            client,
            entry["id"],
            stages["Odrzucony"]["id"],
            rejection_reason="Brak budżetu",
        )
        body = _move(client, entry["id"], stages["Kontakt"]["id"]).json()
        assert body["closed_at"] is None
        assert body["rejection_reason"] is None
    finally:
        _move(client, entry["id"], initial_stage)


def test_move_to_unknown_stage_returns_404(client, entry_and_stages):
    entry, _ = entry_and_stages
    response = _move(client, entry["id"], 9_999_999)
    assert response.status_code == 404
    assert response.json()["detail"] == "Etap lejka nie istnieje"
