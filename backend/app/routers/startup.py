from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import TaskOut, QuoteOut, FolderOut
from app.routers.tasks import get_active_tasks, get_completed_tasks
from app.routers.heatmap import get_heatmap
from app.routers.quotes import get_daily_quote
from app.routers.folders import get_folders, sweep_stale_empty_folders

router = APIRouter(prefix="/startup", tags=["startup"])


@router.get("")
def startup(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sweep_stale_empty_folders(db, current_user.id)
    return {
        "active_tasks": [TaskOut.model_validate(t) for t in get_active_tasks(current_user, db)],
        "completed_tasks": [TaskOut.model_validate(t) for t in get_completed_tasks(current_user, db)],
        "heatmap_timestamps": get_heatmap(current_user, db),
        "quote": QuoteOut.model_validate(get_daily_quote(db)),
        "folders": [FolderOut.model_validate(f) for f in get_folders(db, current_user.id)],
    }
