from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    xp_earned: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="progress_records"
    )
    lesson: Mapped["Lesson"] = relationship(  # type: ignore[name-defined]
        "Lesson", back_populates="progress_records"
    )

    def __repr__(self) -> str:
        return (
            f"<UserProgress id={self.id} user_id={self.user_id} "
            f"lesson_id={self.lesson_id} xp_earned={self.xp_earned}>"
        )
