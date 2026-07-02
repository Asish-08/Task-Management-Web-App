from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    task = Task(title=title)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskOut])
def get_active_tasks(db: Session = Depends(get_db)):
    return (
        db.query(Task)
        .filter(Task.status == "active")
        .order_by(Task.created_at.asc(), Task.id.asc())
        .all()
    )


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    task.title = title
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete", response_model=TaskOut)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "completed":
        raise HTTPException(status_code=409, detail="Task already completed")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.get("/completed", response_model=list[TaskOut])
def get_completed_tasks(db: Session = Depends(get_db)):
    return (
        db.query(Task)
        .filter(Task.status == "completed")
        .order_by(Task.completed_at.desc())
        .limit(200)
        .all()
    )
