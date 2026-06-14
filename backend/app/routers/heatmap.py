from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Task

router = APIRouter(prefix="/heatmap", tags=["heatmap"])


@router.get("", response_model=list[str])
def get_heatmap(db: Session = Depends(get_db)):
    """Return UTC ISO-8601 timestamps for all task completions in the past 365 days.

    Returning raw timestamps lets the client group by the user's local date,
    fixing off-by-one errors for users in UTC-offset timezones.
    """
    # 400 days covers the monthly-aligned grid (up to ~372 days) plus Monday-alignment padding
    start_dt = datetime.now(timezone.utc) - timedelta(days=400)     

    rows = (
        db.query(Task.completed_at)
        .filter(Task.status == "completed")
        .filter(Task.completed_at >= start_dt)
        .order_by(Task.completed_at)
        .all()
    )

    result = []
    for (completed_at,) in rows:
        if completed_at is None:
            continue
        # SQLite stores naive datetimes; append Z so the client treats them as UTC
        if completed_at.tzinfo is None:
            result.append(completed_at.isoformat() + "Z")
        else:
            result.append(completed_at.isoformat())
    return result
