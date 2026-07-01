from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    firebase_uid: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(20), default="student", nullable=False)

    # ── Gamification ──────────────────────────────────────────────────────────
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)           # Tanga (regular)
    oxforder_tanga: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Premium; 1 per 1000 Tanga

    # ── Activity tracking ─────────────────────────────────────────────────────
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    exam_sessions: Mapped[list["ExamSession"]] = relationship(  # type: ignore[name-defined]
        "ExamSession", back_populates="user", lazy="select"
    )
    progress_records: Mapped[list["UserProgress"]] = relationship(  # type: ignore[name-defined]
        "UserProgress", back_populates="user", lazy="select"
    )
    drill_cards: Mapped[list["DrillCard"]] = relationship(  # type: ignore[name-defined]
        "DrillCard", back_populates="user", lazy="select"
    )
    bookmarks: Mapped[list["Bookmark"]] = relationship(  # type: ignore[name-defined]
        "Bookmark", back_populates="user", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} level={self.level}>"
