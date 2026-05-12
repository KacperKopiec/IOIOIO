def test_coordinator_dashboard_shape(client):
    response = client.get("/dashboard/coordinator", params={"event_id": 1})
    assert response.status_code == 200
    body = response.json()
    assert {
        "event_id",
        "event_name",
        "kpi_partners_count",
        "kpi_total_value",
        "kpi_pipeline_count",
        "upcoming_tasks",
        "recent_activities",
    } <= body.keys()


def test_coordinator_unknown_event_returns_404(client):
    response = client.get("/dashboard/coordinator", params={"event_id": 9999999})
    assert response.status_code == 404


def test_promotion_dashboard_shape(client):
    response = client.get("/dashboard/promotion")
    assert response.status_code == 200
    body = response.json()
    assert "active_events" in body
    assert isinstance(body["active_events"], list)


def test_relationship_manager_requires_user(client):
    response = client.get("/dashboard/relationship-manager")
    assert response.status_code == 422


def test_relationship_manager_unknown_user_returns_404(client):
    response = client.get("/dashboard/relationship-manager", params={"user_id": 9999999})
    assert response.status_code == 404
    assert response.json()["detail"] == "Użytkownik nie istnieje"


def test_reports_endpoint(client):
    response = client.get("/reports")
    assert response.status_code == 200
    body = response.json()
    assert {"totals", "new_sponsors", "events", "top_companies"} <= body.keys()
