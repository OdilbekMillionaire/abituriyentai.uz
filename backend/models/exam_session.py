import enum
from datetime import datetime
from sqlalchemy import (
    Integer, Float, DateTime, ForeignKey, Enum as SAEnum, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED   = "SUBMITTED"
    EXPIRED     = "EXPIRED"


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    time_limit_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus, name="session_status_enum"),
        default=SessionStatus.IN_PROGRESS,
        nullable=False,
        index=True,
    )

    # ── Scores (computed on submit) ───────────────────────────────────────────
    total_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    mother_tongue_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    math_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    history_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="exam_sessions"
    )
    answers: Mapped[list["ExamAnswer"]] = relationship(  # type: ignore[name-defined]
        "ExamAnswer", back_populates="session", lazy="select", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<ExamSession id={self.id} user_id={self.user_id} "
            f"status={self.status.value!r} total_score={self.total_score}>"
        )
