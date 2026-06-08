from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Quote
from app.schemas import QuoteOut

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=QuoteOut)
def get_daily_quote(db: Session = Depends(get_db)):
    total = db.query(func.count(Quote.id)).scalar()
    if total == 0:
        return QuoteOut(text="Keep going!", author=None)

    day_index = date.today().toordinal() % total
    quote = db.query(Quote).order_by(Quote.id).offset(day_index).limit(1).first()
    return quote
