from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.database import get_db
from app.models import Folder, Task, User
from app.schemas import TaskCreate, TaskUpdate, TaskOut, TaskFolderUpdate, CompleteTaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    task = Task(title=title, user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskOut])
def get_active_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Task)
        .filter(Task.status == "active", Task.user_id == current_user.id)
        .order_by(Task.created_at.asc(), Task.id.asc())
        .all()
    )


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    task.title = title
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/folder", response_model=TaskOut)
def set_task_folder(
    task_id: int,
    payload: TaskFolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    new_folder_id = payload.folder_id
    if new_folder_id is not None:
        folder = db.get(Folder, new_folder_id)
        if not folder or folder.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Folder not found")

    old_folder_id = task.folder_id
    task.folder_id = new_folder_id
    db.flush()

    # Dragged out of (or moved out of) a folder — if that folder is now empty,
    # restart its idle clock rather than deleting it immediately, giving the
    # user a chance to drag something back in.
    if old_folder_id is not None and old_folder_id != new_folder_id:
        remaining = db.query(Task).filter(Task.folder_id == old_folder_id).count()
        if remaining == 0:
            old_folder = db.get(Folder, old_folder_id)
            old_folder.emptied_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete", response_model=CompleteTaskOut)
def complete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "completed":
        raise HTTPException(status_code=409, detail="Task already completed")

    folder_id_before = task.folder_id
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    db.flush()

    deleted_folder_id = None
    if folder_id_before is not None:
        remaining_active = (
            db.query(Task)
            .filter(Task.folder_id == folder_id_before, Task.status == "active")
            .count()
        )
        if remaining_active == 0:
            db.query(Folder).filter(Folder.id == folder_id_before).delete()
            deleted_folder_id = folder_id_before

    db.commit()
    db.refresh(task)
    return CompleteTaskOut(task=TaskOut.model_validate(task), deleted_folder_id=deleted_folder_id)


@router.get("/completed", response_model=list[TaskOut])
def get_completed_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Task)
        .filter(Task.status == "completed", Task.user_id == current_user.id)
        .order_by(Task.completed_at.desc())
        .limit(200)
        .all()
    )
