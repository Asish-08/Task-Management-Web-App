from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Body, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.database import get_db
from app.models import Folder, Task, User
from app.schemas import FolderCreate, FolderRename, FolderOut

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("", response_model=FolderOut, status_code=201)
def create_folder(
    payload: FolderCreate | None = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = (payload.name.strip() if payload and payload.name else "") or "Untitled Folder"
    folder = Folder(name=name, user_id=current_user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=FolderOut)
def rename_folder(
    folder_id: int,
    payload: FolderRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.get(Folder, folder_id)
    if not folder or folder.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Folder not found")
    name = payload.name.strip()
    folder.name = name or "Untitled Folder"
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=204)
def delete_folder(folder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder or folder.user_id != current_user.id:
        return Response(status_code=204)
    has_tasks = (
        db.query(Task)
        .filter(Task.folder_id == folder_id, Task.user_id == current_user.id)
        .first()
        is not None
    )
    if has_tasks:
        raise HTTPException(status_code=409, detail="Folder is not empty")
    db.delete(folder)
    db.commit()
    return Response(status_code=204)


def get_folders(db: Session, user_id: int) -> list[Folder]:
    return db.query(Folder).filter(Folder.user_id == user_id).order_by(Folder.created_at.asc()).all()


def sweep_stale_empty_folders(db: Session, user_id: int) -> None:
    """Delete folders that have been empty for over a minute.

    Runs on every /startup call so a folder that expired while the tab was
    closed still gets cleaned up. Silent — no notification, since the live
    client-side timer (not this sweep) owns showing that to the user.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=1)
    stale_ids = [
        f.id
        for f in db.query(Folder.id).filter(Folder.emptied_at < cutoff, Folder.user_id == user_id).all()
        if db.query(Task).filter(Task.folder_id == f.id).first() is None
    ]
    if stale_ids:
        db.query(Folder).filter(Folder.id.in_(stale_ids)).delete(synchronize_session=False)
        db.commit()
