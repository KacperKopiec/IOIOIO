def test_management_dashboard_shape(client):
    response = client.get("/dashboard/management")
    assert response.status_code == 200
    body = response.json()
    assert {"stats", "active_events", "upcoming_events", "recent_activities"} <= body.keys()
    assert {"active_partnerships", "total_value", "conversion_rate", "pipeline_count"} <= body["stats"].keys()


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
