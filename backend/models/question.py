import enum
from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, Enum as SAEnum, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Subject(str, enum.Enum):
    MOTHER_TONGUE = "MOTHER_TONGUE"    # Ona tili va adabiyot
    MATHEMATICS   = "MATHEMATICS"     # Matematika
    HISTORY       = "HISTORY"         # O'zbekiston tarixi


class Difficulty(str, enum.Enum):
    EASY   = "EASY"
    MEDIUM = "MEDIUM"
    HARD   = "HARD"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    subject: Mapped[Subject] = mapped_column(
        SAEnum(Subject, name="subject_enum"), nullable=False, index=True
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        SAEnum(Difficulty, name="difficulty_enum"), nullable=False, index=True
    )

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[str] = mapped_column(String(512), nullable=False)
    option_b: Mapped[str] = mapped_column(String(512), nullable=False)
    option_c: Mapped[str] = mapped_column(String(512), nullable=False)
    option_d: Mapped[str] = mapped_column(String(512), nullable=False)

    # "A", "B", "C", or "D"
    correct_option: Mapped[str] = mapped_column(String(1), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)

    # DTM/UzBMB 2026 competency-based flag
    is_competency_based: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # JSON array — e.g. ["LOGIC", "WORD_PROBLEM"] for Math;
    # ["ERA_NEW_UZBEKISTAN"] for History
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # History-specific: "ANCIENT" | "MEDIEVAL" | "COLONIAL" | "SOVIET"
    #                   | "INDEPENDENCE" | "NEW_UZBEKISTAN"
    era_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Ministry of Education decree reference, e.g. "DTM 2026-03 §4.2"
    source_decree: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    exam_answers: Mapped[list["ExamAnswer"]] = relationship(  # type: ignore[name-defined]
        "ExamAnswer", back_populates="question", lazy="select"
    )
    drill_cards: Mapped[list["DrillCard"]] = relationship(  # type: ignore[name-defined]
        "DrillCard", back_populates="question", lazy="select"
    )
    bookmarks: Mapped[list["Bookmark"]] = relationship(  # type: ignore[name-defined]
        "Bookmark", back_populates="question", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<Question id={self.id} subject={self.subject.value!r} "
            f"difficulty={self.difficulty.value!r}>"
        )
