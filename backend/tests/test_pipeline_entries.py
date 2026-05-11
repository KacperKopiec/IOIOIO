def test_duplicate_entry_returns_409(client):
    existing = client.get("/pipeline-entries", params={"event_id": 1}).json()
    assert existing, "expected at least one pipeline entry for event 1"
    entry = existing[0]
    response = client.post(
        "/pipeline-entries",
        json={"event_id": entry["event_id"], "company_id": entry["company_id"]},
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Firma jest już przypisana do tego wydarzenia"


def test_move_sets_offer_sent_at(client):
    entries = client.get("/pipeline-entries", params={"event_id": 2, "stage_id": 1}).json()
    if not entries:
        return
    entry = entries[0]
    stages = client.get("/pipeline-stages").json()
    offer_stage = next(s for s in stages if s["name"] == "Oferta wysłana")

    initial_stage = entry["stage_id"]
    moved = client.post(
        f"/pipeline-entries/{entry['id']}/move",
        json={"stage_id": offer_stage["id"]},
    ).json()
    assert moved["stage_id"] == offer_stage["id"]
    assert moved["offer_sent_at"] is not None

    # restore
    client.post(
        f"/pipeline-entries/{entry['id']}/move",
        json={"stage_id": initial_stage},
    )


def test_move_to_unknown_stage_returns_404(client):
    entries = client.get("/pipeline-entries", params={"event_id": 1}).json()
    assert entries
    response = client.post(
        f"/pipeline-entries/{entries[0]['id']}/move",
        json={"stage_id": 99999},
    )
    assert response.status_code == 404
