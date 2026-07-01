"""
DrillCard — per-user spaced-repetition state for a single question.
Uses a simplified SM-2 algorithm: ease_factor, interval (days), repetitions.
"""

from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class DrillCard(Base):
    __tablename__ = "drill_cards"
    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_drill_user_question"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)

    # SM-2 state
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    interval: Mapped[int] = mapped_column(Integer, default=1, nullable=False)   # days
    repetitions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_review_at: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Lifetime accuracy tracking
    total_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="drill_cards")          # type: ignore[name-defined]
    question: Mapped["Question"] = relationship(back_populates="drill_cards")  # type: ignore[name-defined]
