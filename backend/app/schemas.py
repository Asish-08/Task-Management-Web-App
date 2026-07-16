import re
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


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


# Kept in sync by hand with the identical 5-rule checklist in
# frontend/src/components/auth/SignupPage.jsx — update both together.
_PASSWORD_RULES = [
    (re.compile(r".{8,}"), "at least 8 characters"),
    (re.compile(r"[A-Z]"), "an uppercase letter"),
    (re.compile(r"[a-z]"), "a lowercase letter"),
    (re.compile(r"\d"), "a digit"),
    (re.compile(r"[^A-Za-z0-9]"), "a special character"),
]


class SignupIn(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=72)  # bcrypt hard-caps input at 72 bytes

    @field_validator("username")
    @classmethod
    def username_min_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        missing = [msg for pattern, msg in _PASSWORD_RULES if not pattern.search(v)]
        if missing:
            raise ValueError("Password must contain " + ", ".join(missing))
        return v


class LoginIn(BaseModel):
    username: str
    password: str = Field(min_length=1, max_length=72)


class UserOut(BaseModel):
    id: int
    username: str
    email: str | None = None
    name: str | None = None
    bio: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str
    email: EmailStr
    bio: str | None = None

    @field_validator("name")
    @classmethod
    def name_required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        return v


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
