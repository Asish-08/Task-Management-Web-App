from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TaskOut, QuoteOut, FolderOut
from app.routers.tasks import get_active_tasks, get_completed_tasks
from app.routers.heatmap import get_heatmap
from app.routers.quotes import get_daily_quote
from app.routers.folders import get_folders, sweep_stale_empty_folders

router = APIRouter(prefix="/startup", tags=["startup"])


@router.get("")
def startup(db: Session = Depends(get_db)):
    sweep_stale_empty_folders(db)
    return {
        "active_tasks": [TaskOut.model_validate(t) for t in get_active_tasks(db)],
        "completed_tasks": [TaskOut.model_validate(t) for t in get_completed_tasks(db)],
        "heatmap_timestamps": get_heatmap(db),
        "quote": QuoteOut.model_validate(get_daily_quote(db)),
        "folders": [FolderOut.model_validate(f) for f in get_folders(db)],
    }
