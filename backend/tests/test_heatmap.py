from tests.conftest import signup_and_get_token


def test_heatmap_returns_list(client, auth_headers):
    r = client.get("/heatmap", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_heatmap_empty_with_no_completed_tasks(client, auth_headers):
    r = client.get("/heatmap", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_heatmap_returns_one_timestamp_per_completion(client, auth_headers):
    task1 = client.post("/tasks", json={"title": "A"}, headers=auth_headers).json()
    task2 = client.post("/tasks", json={"title": "B"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task1['id']}/complete", headers=auth_headers)
    client.patch(f"/tasks/{task2['id']}/complete", headers=auth_headers)

    r = client.get("/heatmap", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_heatmap_timestamps_are_utc_iso_strings(client, auth_headers):
    task = client.post("/tasks", json={"title": "Done"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/complete", headers=auth_headers)

    r = client.get("/heatmap", headers=auth_headers)
    assert r.status_code == 200
    ts = r.json()[0]
    # Must be an ISO-8601 string with a T separator and a UTC marker
    assert "T" in ts
    assert ts.endswith("Z") or "+" in ts.split("T")[1]


def test_heatmap_ordered_oldest_first(client, auth_headers):
    task1 = client.post("/tasks", json={"title": "First"}, headers=auth_headers).json()
    task2 = client.post("/tasks", json={"title": "Second"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task1['id']}/complete", headers=auth_headers)
    client.patch(f"/tasks/{task2['id']}/complete", headers=auth_headers)

    r = client.get("/heatmap", headers=auth_headers)
    timestamps = r.json()
    assert timestamps == sorted(timestamps)


def test_heatmap_requires_auth(client):
    assert client.get("/heatmap").status_code == 403


def test_heatmap_scoped_to_owner(client, auth_headers):
    other = signup_and_get_token(client, username="heatmap-other")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    task = client.post("/tasks", json={"title": "Theirs"}, headers=other_headers).json()
    client.patch(f"/tasks/{task['id']}/complete", headers=other_headers)

    mine = client.get("/heatmap", headers=auth_headers).json()
    assert mine == []
