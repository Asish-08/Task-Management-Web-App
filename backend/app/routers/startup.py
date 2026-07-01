from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TaskOut, QuoteOut
from app.routers.tasks import get_active_tasks, get_completed_tasks
from app.routers.heatmap import get_heatmap
from app.routers.quotes import get_daily_quote

router = APIRouter(prefix="/startup", tags=["startup"])


@router.get("")
def startup(db: Session = Depends(get_db)):
    return {
        "active_tasks": [TaskOut.model_validate(t) for t in get_active_tasks(db)],
        "completed_tasks": [TaskOut.model_validate(t) for t in get_completed_tasks(db)],
        "heatmap_timestamps": get_heatmap(db),
        "quote": QuoteOut.model_validate(get_daily_quote(db)),
    }
