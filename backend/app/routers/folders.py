from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Body, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Folder, Task
from app.schemas import FolderCreate, FolderRename, FolderOut

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("", response_model=FolderOut, status_code=201)
def create_folder(payload: FolderCreate | None = Body(default=None), db: Session = Depends(get_db)):
    name = (payload.name.strip() if payload and payload.name else "") or "Untitled Folder"
    folder = Folder(name=name)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=FolderOut)
def rename_folder(folder_id: int, payload: FolderRename, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    name = payload.name.strip()
    folder.name = name or "Untitled Folder"
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=204)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        return Response(status_code=204)
    has_tasks = db.query(Task).filter(Task.folder_id == folder_id).first() is not None
    if has_tasks:
        raise HTTPException(status_code=409, detail="Folder is not empty")
    db.delete(folder)
    db.commit()
    return Response(status_code=204)


def get_folders(db: Session) -> list[Folder]:
    return db.query(Folder).order_by(Folder.created_at.asc()).all()


def sweep_stale_empty_folders(db: Session) -> None:
    """Delete folders that have been empty for over a minute.

    Runs on every /startup call so a folder that expired while the tab was
    closed still gets cleaned up. Silent — no notification, since the live
    client-side timer (not this sweep) owns showing that to the user.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=1)
    stale_ids = [
        f.id
        for f in db.query(Folder.id).filter(Folder.emptied_at < cutoff).all()
        if db.query(Task).filter(Task.folder_id == f.id).first() is None
    ]
    if stale_ids:
        db.query(Folder).filter(Folder.id.in_(stale_ids)).delete(synchronize_session=False)
        db.commit()
