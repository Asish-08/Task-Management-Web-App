def test_heatmap_returns_list(client):
    r = client.get("/heatmap")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_heatmap_empty_with_no_completed_tasks(client):
    r = client.get("/heatmap")
    assert r.status_code == 200
    assert r.json() == []


def test_heatmap_returns_one_timestamp_per_completion(client):
    task1 = client.post("/tasks", json={"title": "A"}).json()
    task2 = client.post("/tasks", json={"title": "B"}).json()
    client.patch(f"/tasks/{task1['id']}/complete")
    client.patch(f"/tasks/{task2['id']}/complete")

    r = client.get("/heatmap")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_heatmap_timestamps_are_utc_iso_strings(client):
    task = client.post("/tasks", json={"title": "Done"}).json()
    client.patch(f"/tasks/{task['id']}/complete")

    r = client.get("/heatmap")
    assert r.status_code == 200
    ts = r.json()[0]
    # Must be an ISO-8601 string with a T separator and a UTC marker
    assert "T" in ts
    assert ts.endswith("Z") or "+" in ts.split("T")[1]


def test_heatmap_ordered_oldest_first(client):
    task1 = client.post("/tasks", json={"title": "First"}).json()
    task2 = client.post("/tasks", json={"title": "Second"}).json()
    client.patch(f"/tasks/{task1['id']}/complete")
    client.patch(f"/tasks/{task2['id']}/complete")

    r = client.get("/heatmap")
    timestamps = r.json()
    assert timestamps == sorted(timestamps)
