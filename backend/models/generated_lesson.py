from datetime import datetime
from sqlalchemy import String, Integer, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class GeneratedLesson(Base):
    __tablename__ = "generated_lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    subject: Mapped[str] = mapped_column(String(50), nullable=False)
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    format_type: Mapped[str] = mapped_column(String(20), nullable=False, default="text")
    language: Mapped[str] = mapped_column(String(20), nullable=False, default="uzbek")
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    visual_blocks_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    reading_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<GeneratedLesson id={self.id} user_id={self.user_id} topic={self.topic!r}>"
