def test_list_events(client):
    response = client.get("/events")
    assert response.status_code == 200
    names = {row["name"] for row in response.json()["items"]}
    assert "SFI 2024" in names


def test_event_kpi_shape(client):
    response = client.get("/events/1/kpi")
    assert response.status_code == 200
    body = response.json()
    for key in (
        "event_id",
        "partners_count",
        "total_value",
        "pipeline_count",
        "conversion_rate",
        "avg_partner_value",
        "avg_close_days",
    ):
        assert key in body


def test_unknown_event_kpi_returns_404(client):
    response = client.get("/events/9999999/kpi")
    assert response.status_code == 404
    assert response.json()["detail"] == "Wydarzenie nie istnieje"


def test_event_pipeline_endpoint(client):
    response = client.get("/events/1/pipeline")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
