from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from models.question import Subject


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    subject: Mapped[Subject] = mapped_column(
        SAEnum(Subject, name="subject_enum"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)

    # Display ordering within a subject
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # XP awarded when a user completes this lesson
    xp_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    # History-specific era tag, e.g. "NEW_UZBEKISTAN"
    era_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    progress_records: Mapped[list["UserProgress"]] = relationship(  # type: ignore[name-defined]
        "UserProgress", back_populates="lesson", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Lesson id={self.id} subject={self.subject.value!r} title={self.title!r}>"
