from tests.conftest import signup_and_get_token


def test_create_task(client, auth_headers):
    r = client.post("/tasks", json={"title": "Write tests"}, headers=auth_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Write tests"
    assert data["status"] == "active"
    assert data["completed_at"] is None
    assert data["folder_id"] is None


def test_create_task_empty_title(client, auth_headers):
    r = client.post("/tasks", json={"title": "   "}, headers=auth_headers)
    assert r.status_code == 422


def test_get_active_tasks(client, auth_headers):
    client.post("/tasks", json={"title": "Task A"}, headers=auth_headers)
    client.post("/tasks", json={"title": "Task B"}, headers=auth_headers)
    r = client.get("/tasks", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_complete_task(client, auth_headers):
    created = client.post("/tasks", json={"title": "Do it"}, headers=auth_headers).json()
    r = client.patch(f"/tasks/{created['id']}/complete", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["task"]["status"] == "completed"
    assert data["task"]["completed_at"] is not None
    assert data["deleted_folder_id"] is None


def test_complete_task_not_found(client, auth_headers):
    r = client.patch("/tasks/9999/complete", headers=auth_headers)
    assert r.status_code == 404


def test_complete_task_already_completed(client, auth_headers):
    created = client.post("/tasks", json={"title": "Once"}, headers=auth_headers).json()
    client.patch(f"/tasks/{created['id']}/complete", headers=auth_headers)
    r = client.patch(f"/tasks/{created['id']}/complete", headers=auth_headers)
    assert r.status_code == 409


def test_get_completed_tasks(client, auth_headers):
    created = client.post("/tasks", json={"title": "Done task"}, headers=auth_headers).json()
    client.patch(f"/tasks/{created['id']}/complete", headers=auth_headers)
    r = client.get("/tasks/completed", headers=auth_headers)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["status"] == "completed"


def test_completed_tasks_not_in_active(client, auth_headers):
    created = client.post("/tasks", json={"title": "Complete me"}, headers=auth_headers).json()
    client.patch(f"/tasks/{created['id']}/complete", headers=auth_headers)
    active = client.get("/tasks", headers=auth_headers).json()
    assert all(t["id"] != created["id"] for t in active)


def test_update_task_title(client, auth_headers):
    created = client.post("/tasks", json={"title": "Old title"}, headers=auth_headers).json()
    res = client.patch(f"/tasks/{created['id']}", json={"title": "New title"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["title"] == "New title"


def test_update_task_empty_title(client, auth_headers):
    created = client.post("/tasks", json={"title": "Something"}, headers=auth_headers).json()
    res = client.patch(f"/tasks/{created['id']}", json={"title": "   "}, headers=auth_headers)
    assert res.status_code == 422


def test_update_task_not_found(client, auth_headers):
    res = client.patch("/tasks/99999", json={"title": "Ghost"}, headers=auth_headers)
    assert res.status_code == 404


def test_tasks_require_auth(client):
    assert client.get("/tasks").status_code == 403
    assert client.post("/tasks", json={"title": "x"}).status_code == 403
    assert client.get("/tasks/completed").status_code == 403


def test_tasks_scoped_to_owner(client, auth_headers):
    other = signup_and_get_token(client, username="other")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    client.post("/tasks", json={"title": "Mine"}, headers=auth_headers)
    client.post("/tasks", json={"title": "Theirs"}, headers=other_headers)

    mine = client.get("/tasks", headers=auth_headers).json()
    theirs = client.get("/tasks", headers=other_headers).json()
    assert [t["title"] for t in mine] == ["Mine"]
    assert [t["title"] for t in theirs] == ["Theirs"]


def test_cannot_update_other_users_task(client, auth_headers):
    other = signup_and_get_token(client, username="other2")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    theirs = client.post("/tasks", json={"title": "Theirs"}, headers=other_headers).json()

    r = client.patch(f"/tasks/{theirs['id']}", json={"title": "Hijacked"}, headers=auth_headers)
    assert r.status_code == 404


def test_cannot_complete_other_users_task(client, auth_headers):
    other = signup_and_get_token(client, username="other3")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    theirs = client.post("/tasks", json={"title": "Theirs"}, headers=other_headers).json()

    r = client.patch(f"/tasks/{theirs['id']}/complete", headers=auth_headers)
    assert r.status_code == 404
