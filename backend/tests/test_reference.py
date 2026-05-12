def test_pipeline_stages_seeded(client):
    response = client.get("/pipeline-stages")
    assert response.status_code == 200
    items = response.json()
    names = [item["name"] for item in items]
    assert names == [
        "Kontakt",
        "Oferta wysłana",
        "Negocjacje",
        "Decyzja: TAK",
        "Odrzucony",
    ]
    assert items[3]["outcome"] == "won"
    assert items[4]["outcome"] == "lost"


def test_industries_seeded(client):
    response = client.get("/industries")
    assert response.status_code == 200
    names = {row["name"] for row in response.json()}
    assert {"IT", "Fintech", "Telco"}.issubset(names)


def test_roles_are_three_canonical(client):
    response = client.get("/roles")
    assert response.status_code == 200
    names = {row["name"] for row in response.json()}
    assert names == {"koordynator", "opiekun", "promocja"}
