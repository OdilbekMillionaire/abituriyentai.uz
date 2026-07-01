"""
AI Lesson Generator endpoints.
POST /ai-lessons/generate      — Generate a full AI lesson (auto-saved to DB)
POST /ai-lessons/quiz          — Generate post-lesson quiz
GET  /ai-lessons/topics        — Get topic list per subject
GET  /ai-lessons/my-lessons    — List user's saved AI lessons
DELETE /ai-lessons/my-lessons/{id} — Delete a saved AI lesson
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from cache import cache_get, cache_set
from database import get_db
from routers.auth import get_current_user
from models.user import User
from models.generated_lesson import GeneratedLesson
from services.ai_service import (
    generate_ai_lesson,
    generate_post_lesson_quiz,
    TOPICS_BY_SUBJECT,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class GenerateLessonRequest(BaseModel):
    subject: str = Field(..., description="MOTHER_TONGUE | MATHEMATICS | HISTORY")
    topic: str = Field(..., min_length=2, max_length=200)
    format_type: str = Field("text", description="text | visual | audio")
    difficulty: str = Field("medium", description="easy | medium | hard")
    language: str = Field("uz", description="uz | ru | en | qq")
    length: str = Field("medium", description="short | medium | deep")

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Mavzu kamida 2 ta belgidan iborat bo'lishi kerak")
        if len(v) > 200:
            raise ValueError("Mavzu 200 ta belgidan oshmasligi kerak")
        return v


class VisualBlock(BaseModel):
    type: str
    heading: str | None = None
    body: str | None = None
    term: str | None = None
    definition: str | None = None
    emoji: str | None = None
    columns: list[str] | None = None
    rows: list[list[str]] | None = None
    formula: str | None = None
    explanation: str | None = None
    points: list[str] | None = None
    problem: str | None = None
    solution: str | None = None
    events: list[dict] | None = None
    items: list[dict] | None = None


class GenerateLessonResponse(BaseModel):
    title: str
    content_markdown: str
    visual_blocks: list[dict]
    reading_time_minutes: int
    tanga_reward: int
    format: str
    subject: str
    topic: str
    saved_lesson_id: int | None = None
    is_ai_generated: bool = True
    ai_disclaimer: str = "Ushbu dars sun'iy intellekt tomonidan yaratilgan va rasmiy BMBA manba emas."


class QuizRequest(BaseModel):
    lesson_content: str
    topic: str
    subject: str
    language: str = "uz"
    num_questions: int = Field(5, ge=3, le=10)


class QuizQuestion(BaseModel):
    question: str
    options: dict[str, str]
    correct: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[dict]
    topic: str


class TopicsResponse(BaseModel):
    subject: str
    topics: list[str]


class SavedLessonItem(BaseModel):
    id: int
    subject: str
    topic: str
    title: str
    format_type: str
    language: str
    reading_time_minutes: int
    created_at: str


class SavedLessonsResponse(BaseModel):
    lessons: list[SavedLessonItem]
    total: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateLessonResponse)
async def generate_lesson(
    request: Request,
    req: GenerateLessonRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a full AI-powered lesson on any DTM topic. Auto-saved to user's library."""
    valid_subjects = {"MOTHER_TONGUE", "MATHEMATICS", "HISTORY"}
    if req.subject not in valid_subjects:
        raise HTTPException(400, f"subject must be one of: {valid_subjects}")

    valid_formats = {"text", "visual", "audio"}
    if req.format_type not in valid_formats:
        raise HTTPException(400, f"format_type must be one of: {valid_formats}")

    valid_lengths = {"short", "medium", "deep"}
    if req.length not in valid_lengths:
        raise HTTPException(400, f"length must be one of: {valid_lengths}")

    try:
        result = await generate_ai_lesson(
            subject=req.subject,
            topic=req.topic,
            format_type=req.format_type,
            difficulty=req.difficulty,
            language=req.language,
            length=req.length,
        )
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    # Auto-save to DB
    saved_id: int | None = None
    try:
        saved = GeneratedLesson(
            user_id=current_user.id,
            subject=req.subject,
            topic=req.topic,
            format_type=req.format_type,
            language=req.language,
            title=result["title"],
            content_markdown=result["content_markdown"],
            visual_blocks_json=json.dumps(result["visual_blocks"]) if result["visual_blocks"] else None,
            reading_time_minutes=result["reading_time_minutes"],
        )
        db.add(saved)
        await db.flush()
        await db.refresh(saved)
        saved_id = saved.id
    except Exception as e:
        logger.warning("Failed to save generated lesson: %s", e)

    return GenerateLessonResponse(
        title=result["title"],
        content_markdown=result["content_markdown"],
        visual_blocks=result["visual_blocks"],
        reading_time_minutes=result["reading_time_minutes"],
        tanga_reward=result["tanga_reward"],
        format=result["format"],
        subject=req.subject,
        topic=req.topic,
        saved_lesson_id=saved_id,
    )


@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    req: QuizRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a post-lesson quiz based on lesson content."""
    cache_key = f"quiz_{hash(req.lesson_content[:100])}_{req.language}_{req.num_questions}"
    cached = cache_get(cache_key)
    if cached:
        return QuizResponse(questions=cached, topic=req.topic)

    try:
        questions = await generate_post_lesson_quiz(
            lesson_content=req.lesson_content,
            topic=req.topic,
            subject=req.subject,
            language=req.language,
            num_questions=req.num_questions,
        )
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    cache_set(cache_key, questions, ttl_seconds=3600)
    return QuizResponse(questions=questions, topic=req.topic)


@router.get("/my-lessons", response_model=SavedLessonsResponse)
async def get_my_lessons(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """List user's saved AI-generated lessons, newest first."""
    result = await db.execute(
        select(GeneratedLesson)
        .where(GeneratedLesson.user_id == current_user.id)
        .order_by(GeneratedLesson.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    lessons = result.scalars().all()

    count_result = await db.execute(
        select(GeneratedLesson).where(GeneratedLesson.user_id == current_user.id)
    )
    total = len(count_result.scalars().all())

    return SavedLessonsResponse(
        lessons=[
            SavedLessonItem(
                id=l.id,
                subject=l.subject,
                topic=l.topic,
                title=l.title,
                format_type=l.format_type,
                language=l.language,
                reading_time_minutes=l.reading_time_minutes,
                created_at=l.created_at.strftime("%Y-%m-%d %H:%M"),
            )
            for l in lessons
        ],
        total=total,
    )


@router.get("/my-lessons/{lesson_id}", response_model=GenerateLessonResponse)
async def get_saved_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a specific saved AI lesson."""
    result = await db.execute(
        select(GeneratedLesson).where(
            GeneratedLesson.id == lesson_id,
            GeneratedLesson.user_id == current_user.id,
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(404, "Saqlangan dars topilmadi.")

    visual_blocks = []
    if lesson.visual_blocks_json:
        try:
            visual_blocks = json.loads(lesson.visual_blocks_json)
        except Exception:
            pass

    return GenerateLessonResponse(
        title=lesson.title,
        content_markdown=lesson.content_markdown,
        visual_blocks=visual_blocks,
        reading_time_minutes=lesson.reading_time_minutes,
        tanga_reward=0,
        format=lesson.format_type,
        subject=lesson.subject,
        topic=lesson.topic,
        saved_lesson_id=lesson.id,
    )


@router.delete("/my-lessons/{lesson_id}")
async def delete_saved_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved AI lesson."""
    result = await db.execute(
        select(GeneratedLesson).where(
            GeneratedLesson.id == lesson_id,
            GeneratedLesson.user_id == current_user.id,
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(404, "Saqlangan dars topilmadi.")
    await db.delete(lesson)
    return {"message": "Dars o'chirildi."}


@router.get("/topics/{subject}", response_model=TopicsResponse)
async def get_topics(
    subject: str,
    current_user: User = Depends(get_current_user),
):
    """Get the enhanced topic list for a subject."""
    subject_upper = subject.upper()
    topics = TOPICS_BY_SUBJECT.get(subject_upper)
    if not topics:
        raise HTTPException(404, f"Subject '{subject}' not found")
    return TopicsResponse(subject=subject_upper, topics=topics)


@router.get("/topics", response_model=dict)
async def get_all_topics(
    current_user: User = Depends(get_current_user),
):
    """Get all topics for all subjects."""
    return TOPICS_BY_SUBJECT
