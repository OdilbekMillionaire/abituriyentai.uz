from sqlalchemy import Integer, Float, Boolean, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("exam_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # "A", "B", "C", or "D" — null means the question was skipped/unanswered
    selected_option: Mapped[str | None] = mapped_column(String(1), nullable=True)

    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 1.1 if correct, 0.0 if wrong or unanswered (DTM standard — no negative marking)
    points_earned: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    session: Mapped["ExamSession"] = relationship(  # type: ignore[name-defined]
        "ExamSession", back_populates="answers"
    )
    question: Mapped["Question"] = relationship(  # type: ignore[name-defined]
        "Question", back_populates="exam_answers"
    )

    def __repr__(self) -> str:
        return (
            f"<ExamAnswer id={self.id} session_id={self.session_id} "
            f"question_id={self.question_id} correct={self.is_correct}>"
        )
