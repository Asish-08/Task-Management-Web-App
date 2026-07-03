from datetime import datetime
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str


class TaskUpdate(BaseModel):
    title: str


class TaskOut(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime
    completed_at: datetime | None = None
    folder_id: int | None = None

    model_config = {"from_attributes": True}


class TaskFolderUpdate(BaseModel):
    folder_id: int | None


class CompleteTaskOut(BaseModel):
    task: TaskOut
    deleted_folder_id: int | None = None


class FolderCreate(BaseModel):
    name: str = "Untitled Folder"


class FolderRename(BaseModel):
    name: str


class FolderOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    emptied_at: datetime

    model_config = {"from_attributes": True}


class QuoteOut(BaseModel):
    text: str
    author: str | None = None

    model_config = {"from_attributes": True}
