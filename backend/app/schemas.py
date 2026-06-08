from datetime import datetime
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str


class TaskOut(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class QuoteOut(BaseModel):
    text: str
    author: str | None = None

    model_config = {"from_attributes": True}
