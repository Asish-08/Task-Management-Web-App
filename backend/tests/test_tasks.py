def test_create_task(client):
    r = client.post("/tasks", json={"title": "Write tests"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Write tests"
    assert data["status"] == "active"
    assert data["completed_at"] is None


def test_create_task_empty_title(client):
    r = client.post("/tasks", json={"title": "   "})
    assert r.status_code == 422


def test_get_active_tasks(client):
    client.post("/tasks", json={"title": "Task A"})
    client.post("/tasks", json={"title": "Task B"})
    r = client.get("/tasks")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_complete_task(client):
    created = client.post("/tasks", json={"title": "Do it"}).json()
    r = client.patch(f"/tasks/{created['id']}/complete")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "completed"
    assert data["completed_at"] is not None


def test_complete_task_not_found(client):
    r = client.patch("/tasks/9999/complete")
    assert r.status_code == 404


def test_complete_task_already_completed(client):
    created = client.post("/tasks", json={"title": "Once"}).json()
    client.patch(f"/tasks/{created['id']}/complete")
    r = client.patch(f"/tasks/{created['id']}/complete")
    assert r.status_code == 409


def test_get_completed_tasks(client):
    created = client.post("/tasks", json={"title": "Done task"}).json()
    client.patch(f"/tasks/{created['id']}/complete")
    r = client.get("/tasks/completed")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["status"] == "completed"


def test_completed_tasks_not_in_active(client):
    created = client.post("/tasks", json={"title": "Complete me"}).json()
    client.patch(f"/tasks/{created['id']}/complete")
    active = client.get("/tasks").json()
    assert all(t["id"] != created["id"] for t in active)
