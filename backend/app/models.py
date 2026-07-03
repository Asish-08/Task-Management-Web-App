from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Folder(Base):
    __tablename__ = "folders"

    id:         Mapped[int]      = mapped_column(primary_key=True)
    name:       Mapped[str]      = mapped_column(Text, nullable=False, default="Untitled Folder")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    emptied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Task(Base):
    __tablename__ = "tasks"

    id:           Mapped[int]            = mapped_column(primary_key=True)
    title:        Mapped[str]            = mapped_column(Text, nullable=False)
    status:       Mapped[str]            = mapped_column(String(20), default="active")
    created_at:   Mapped[datetime]       = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    folder_id:    Mapped[int | None] = mapped_column(
        ForeignKey("folders.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        CheckConstraint("status IN ('active','completed')", name="chk_status"),
    )


class Quote(Base):
    __tablename__ = "quotes"

    id:     Mapped[int]       = mapped_column(primary_key=True)
    text:   Mapped[str]       = mapped_column(Text, nullable=False)
    author: Mapped[str | None] = mapped_column(String(100), nullable=True)
