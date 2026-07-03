from datetime import datetime, timedelta, timezone

from app.database import Base
from app.models import Folder


def _insert_backdated_folder(minutes_ago, name="Old"):
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    try:
        folder = Folder(
            name=name,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
            emptied_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
        )
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return folder.id
    finally:
        db.close()


def test_create_folder_default_name(client):
    r = client.post("/folders", json={})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Untitled Folder"


def test_create_folder_no_body(client):
    r = client.post("/folders")
    assert r.status_code == 201
    assert r.json()["name"] == "Untitled Folder"


def test_create_folder_with_name(client):
    r = client.post("/folders", json={"name": "Work"})
    assert r.status_code == 201
    assert r.json()["name"] == "Work"


def test_rename_folder(client):
    created = client.post("/folders", json={}).json()
    r = client.patch(f"/folders/{created['id']}", json={"name": "Groceries"})
    assert r.status_code == 200
    assert r.json()["name"] == "Groceries"


def test_rename_folder_blank_falls_back(client):
    created = client.post("/folders", json={}).json()
    r = client.patch(f"/folders/{created['id']}", json={"name": "   "})
    assert r.status_code == 200
    assert r.json()["name"] == "Untitled Folder"


def test_rename_folder_not_found(client):
    r = client.patch("/folders/9999", json={"name": "Ghost"})
    assert r.status_code == 404


def test_delete_folder(client):
    created = client.post("/folders", json={}).json()
    r = client.delete(f"/folders/{created['id']}")
    assert r.status_code == 204


def test_delete_folder_not_found_is_idempotent(client):
    r = client.delete("/folders/9999")
    assert r.status_code == 204


def test_delete_nonempty_folder_conflict(client):
    folder = client.post("/folders", json={}).json()
    task = client.post("/tasks", json={"title": "In folder"}).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]})
    r = client.delete(f"/folders/{folder['id']}")
    assert r.status_code == 409


def test_assign_task_to_folder(client):
    folder = client.post("/folders", json={}).json()
    task = client.post("/tasks", json={"title": "Task"}).json()
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]})
    assert r.status_code == 200
    assert r.json()["folder_id"] == folder["id"]


def test_assign_task_to_nonexistent_folder(client):
    task = client.post("/tasks", json={"title": "Task"}).json()
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": 9999})
    assert r.status_code == 404


def test_assign_task_not_found(client):
    folder = client.post("/folders", json={}).json()
    r = client.patch("/tasks/9999/folder", json={"folder_id": folder["id"]})
    assert r.status_code == 404


def test_unassign_task_from_folder(client):
    folder = client.post("/folders", json={}).json()
    task = client.post("/tasks", json={"title": "Task"}).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]})
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": None})
    assert r.status_code == 200
    assert r.json()["folder_id"] is None


def test_drag_out_bumps_emptied_at_and_keeps_folder(client):
    folder = client.post("/folders", json={}).json()
    task = client.post("/tasks", json={"title": "Task"}).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]})
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": None})

    startup = client.get("/startup").json()
    remaining = [f for f in startup["folders"] if f["id"] == folder["id"]]
    assert len(remaining) == 1
    assert remaining[0]["emptied_at"] > folder["emptied_at"]


def test_folder_to_folder_move(client):
    folder_a = client.post("/folders", json={}).json()
    folder_b = client.post("/folders", json={}).json()
    task = client.post("/tasks", json={"title": "Task"}).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder_a["id"]})
    r = client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder_b["id"]})
    assert r.status_code == 200
    assert r.json()["folder_id"] == folder_b["id"]

    startup = client.get("/startup").json()
    remaining = [f for f in startup["folders"] if f["id"] == folder_a["id"]]
    assert len(remaining) == 1
    assert remaining[0]["emptied_at"] > folder_a["emptied_at"]


def test_complete_last_task_in_folder_deletes_folder(client):
    folder = client.post("/folders", json={}).json()
    task = client.post("/tasks", json={"title": "Task"}).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": folder["id"]})
    r = client.patch(f"/tasks/{task['id']}/complete")
    assert r.status_code == 200
    data = r.json()
    assert data["deleted_folder_id"] == folder["id"]

    startup = client.get("/startup").json()
    assert all(f["id"] != folder["id"] for f in startup["folders"])


def test_complete_one_of_two_tasks_in_folder_keeps_folder(client):
    folder = client.post("/folders", json={}).json()
    task_a = client.post("/tasks", json={"title": "A"}).json()
    task_b = client.post("/tasks", json={"title": "B"}).json()
    client.patch(f"/tasks/{task_a['id']}/folder", json={"folder_id": folder["id"]})
    client.patch(f"/tasks/{task_b['id']}/folder", json={"folder_id": folder["id"]})

    r = client.patch(f"/tasks/{task_a['id']}/complete")
    assert r.status_code == 200
    assert r.json()["deleted_folder_id"] is None

    startup = client.get("/startup").json()
    assert any(f["id"] == folder["id"] for f in startup["folders"])


def test_complete_unassigned_task_no_folder_side_effect(client):
    task = client.post("/tasks", json={"title": "Solo"}).json()
    r = client.patch(f"/tasks/{task['id']}/complete")
    assert r.status_code == 200
    assert r.json()["deleted_folder_id"] is None


def test_startup_sweeps_stale_empty_folder(client):
    stale_id = _insert_backdated_folder(minutes_ago=3)
    startup = client.get("/startup").json()
    assert all(f["id"] != stale_id for f in startup["folders"])


def test_startup_keeps_fresh_empty_folder(client):
    created = client.post("/folders", json={}).json()
    startup = client.get("/startup").json()
    assert any(f["id"] == created["id"] for f in startup["folders"])


def test_startup_keeps_stale_folder_with_task(client):
    stale_id = _insert_backdated_folder(minutes_ago=3)
    task = client.post("/tasks", json={"title": "Task"}).json()
    client.patch(f"/tasks/{task['id']}/folder", json={"folder_id": stale_id})

    startup = client.get("/startup").json()
    assert any(f["id"] == stale_id for f in startup["folders"])


def test_startup_includes_folders_key(client):
    r = client.get("/startup")
    assert r.status_code == 200
    assert "folders" in r.json()
