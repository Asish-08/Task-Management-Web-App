from datetime import datetime, timedelta, timezone

from app.models import Folder
from tests.conftest import signup_and_get_token


def _insert_backdated_folder(user_id, minutes_ago, name="Old"):
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    try:
        folder = Folder(
            name=name,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
            emptied_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
            user_id=user_id,
        )
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return folder.id
    finally:
        db.close()


def _user_id(signup_response):
    return signup_response["user"]["id"]


def test_create_folder_default_name(client, auth_headers):
    r = client.post("/folders", json={}, headers=auth_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Untitled Folder"


def test_create_folder_no_body(client, auth_headers):
    r = client.post("/folders", headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Untitled Folder"


def test_create_folder_with_name(client, auth_headers):
    r = client.post("/folders", json={"name": "Work"}, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Work"


def test_rename_folder(client, auth_headers):
    created = client.post("/folders", json={}, headers=auth_headers).json()
    r = client.patch(f"/folders/{created['id']}", json={"name": "Groceries"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Groceries"


def test_rename_folder_blank_falls_back(client, auth_headers):
    created = client.post("/folders", json={}, headers=auth_headers).json()
    r = client.patch(f"/folders/{created['id']}", json={"name": "   "}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Untitled Folder"


def test_rename_folder_not_found(client, auth_headers):
    r = client.patch("/folders/9999", json={"name": "Ghost"}, headers=auth_headers)
    assert r.status_code == 404


def test_delete_folder(client, auth_headers):
    created = client.post("/folders", json={}, headers=auth_headers).json()
    r = client.delete(f"/folders/{created['id']}", headers=auth_headers)
    assert r.status_code == 204


def test_delete_folder_not_found_is_idempotent(client, auth_headers):
    r = client.delete("/folders/9999", headers=auth_headers)
    assert r.status_code == 204


def test_delete_nonempty_folder_conflict(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    task = client.post("/tasks", json={"title": "In folder"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    r = client.delete(f"/folders/{folder['id']}", headers=auth_headers)
    assert r.status_code == 409


def test_assign_task_to_folder(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["folder_id"] == folder["id"]


def test_assign_task_to_nonexistent_folder(client, auth_headers):
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": 9999}, headers=auth_headers)
    assert r.status_code == 404


def test_assign_task_not_found(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    r = client.patch("/tasks/9999/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    assert r.status_code == 404


def test_unassign_task_from_folder(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": None}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["folder_id"] is None


def test_drag_out_bumps_emptied_at_and_keeps_folder(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": None}, headers=auth_headers)

    startup = client.get("/startup", headers=auth_headers).json()
    remaining = [f for f in startup["folders"] if f["id"] == folder["id"]]
    assert len(remaining) == 1
    assert remaining[0]["emptied_at"] > folder["emptied_at"]


def test_folder_to_folder_move(client, auth_headers):
    folder_a = client.post("/folders", json={}, headers=auth_headers).json()
    folder_b = client.post("/folders", json={}, headers=auth_headers).json()
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder_a["id"]}, headers=auth_headers)
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder_b["id"]}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["folder_id"] == folder_b["id"]

    startup = client.get("/startup", headers=auth_headers).json()
    remaining = [f for f in startup["folders"] if f["id"] == folder_a["id"]]
    assert len(remaining) == 1
    assert remaining[0]["emptied_at"] > folder_a["emptied_at"]


def test_complete_last_task_in_folder_deletes_folder(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    r = client.patch(f"/tasks/{task['id']}/complete", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["deleted_folder_id"] == folder["id"]

    startup = client.get("/startup", headers=auth_headers).json()
    assert all(f["id"] != folder["id"] for f in startup["folders"])


def test_complete_one_of_two_tasks_in_folder_keeps_folder(client, auth_headers):
    folder = client.post("/folders", json={}, headers=auth_headers).json()
    task_a = client.post("/tasks", json={"title": "A"}, headers=auth_headers).json()
    task_b = client.post("/tasks", json={"title": "B"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task_a['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)
    client.patch(f"/tasks/{task_b['id']}/folder", json={"folder_id": folder["id"]}, headers=auth_headers)

    r = client.patch(f"/tasks/{task_a['id']}/complete", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["deleted_folder_id"] is None

    startup = client.get("/startup", headers=auth_headers).json()
    assert any(f["id"] == folder["id"] for f in startup["folders"])


def test_complete_unassigned_task_no_folder_side_effect(client, auth_headers):
    task = client.post("/tasks", json={"title": "Solo"}, headers=auth_headers).json()
    r = client.patch(f"/tasks/{task['id']}/complete", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["deleted_folder_id"] is None


def test_startup_sweeps_stale_empty_folder(client, auth_headers, signup_user):
    stale_id = _insert_backdated_folder(_user_id(signup_user), minutes_ago=3)
    startup = client.get("/startup", headers=auth_headers).json()
    assert all(f["id"] != stale_id for f in startup["folders"])


def test_startup_keeps_fresh_empty_folder(client, auth_headers):
    created = client.post("/folders", json={}, headers=auth_headers).json()
    startup = client.get("/startup", headers=auth_headers).json()
    assert any(f["id"] == created["id"] for f in startup["folders"])


def test_startup_keeps_stale_folder_with_task(client, auth_headers, signup_user):
    stale_id = _insert_backdated_folder(_user_id(signup_user), minutes_ago=3)
    task = client.post("/tasks", json={"title": "Task"}, headers=auth_headers).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": stale_id}, headers=auth_headers)

    startup = client.get("/startup", headers=auth_headers).json()
    assert any(f["id"] == stale_id for f in startup["folders"])


def test_startup_includes_folders_key(client, auth_headers):
    r = client.get("/startup", headers=auth_headers)
    assert r.status_code == 200
    assert "folders" in r.json()


def test_folders_require_auth(client):
    assert client.get("/startup").status_code == 403
    assert client.post("/folders", json={}).status_code == 403


def test_folders_scoped_to_owner(client, auth_headers):
    other = signup_and_get_token(client, username="folder-other")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    client.post("/folders", json={"name": "Mine"}, headers=auth_headers)
    client.post("/folders", json={"name": "Theirs"}, headers=other_headers)

    mine = client.get("/startup", headers=auth_headers).json()["folders"]
    theirs = client.get("/startup", headers=other_headers).json()["folders"]
    assert [f["name"] for f in mine] == ["Mine"]
    assert [f["name"] for f in theirs] == ["Theirs"]


def test_cannot_delete_other_users_folder(client, auth_headers):
    other = signup_and_get_token(client, username="folder-other2")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    theirs = client.post("/folders", json={}, headers=other_headers).json()

    r = client.delete(f"/folders/{theirs['id']}", headers=auth_headers)
    assert r.status_code == 204  # idempotent-not-found, no existence leak

    still_there = client.get("/startup", headers=other_headers).json()["folders"]
    assert any(f["id"] == theirs["id"] for f in still_there)


def test_cannot_move_task_into_other_users_folder(client, auth_headers):
    other = signup_and_get_token(client, username="folder-other3")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    their_folder = client.post("/folders", json={}, headers=other_headers).json()
    my_task = client.post("/tasks", json={"title": "Mine"}, headers=auth_headers).json()

    r = client.patch(
        f"/tasks/{my_task['id']}/folder",
        json={"folder_id": their_folder["id"]},
        headers=auth_headers,
    )
    assert r.status_code == 404
