"""
AI Tutor router — Gemini-powered learning assistant.

Endpoints:
  POST /ai/chat          → AI Tutor chat (gemini-2.5-flash)
  POST /ai/hint          → Real-time exam hint (gemini-2.0-flash-lite)
  POST /ai/generate-question → Admin: generate new DTM question (gemini-2.5-pro)
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.question import Question
from models.lesson import Lesson
from models.user import User
from routers.auth import get_current_user, get_admin_user
from services.ai_service import (
    get_ai_tutor_response,
    get_exam_hint,
    generate_question_with_ai,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class TutorChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500,
                          description="Student's question text")
    subject: str = Field(..., description="MOTHER_TONGUE | MATHEMATICS | HISTORY")
    lesson_id: int | None = Field(None, description="Current lesson ID for context")
    language: str = Field("uzbek")  # uzbek | russian | english | karakalpak


class TutorChatResponse(BaseModel):
    answer: str
    subject: str
    model_used: str


class HintRequest(BaseModel):
    question_id: int = Field(..., description="Question ID from active exam session")
    language: str = Field("uzbek")  # uzbek | russian | english | karakalpak


class HintResponse(BaseModel):
    hint: str
    question_id: int
    model_used: str


class GenerateQuestionRequest(BaseModel):
    subject: str = Field(..., description="MOTHER_TONGUE | MATHEMATICS | HISTORY")
    topic: str = Field(..., min_length=3, max_length=200)
    difficulty: str = Field("MEDIUM", pattern="^(EASY|MEDIUM|HARD)$")
    is_competency_based: bool = False


class GenerateQuestionResponse(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str
    tags: list[str]
    subject: str
    difficulty: str
    is_competency_based: bool
    model_used: str
    note: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=TutorChatResponse,
    summary="AI o'qituvchi bilan suhbat (gemini-2.5-flash)",
    description=(
        "Talaba savoliga Gemini 2.5 Flash yordamida javob beradi. "
        "Dars sahifasida o'rnatilgan AI chat paneli uchun."
    ),
)
async def ai_tutor_chat(
    body: TutorChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TutorChatResponse:
    # Optionally fetch lesson content for context
    lesson_context: str | None = None
    if body.lesson_id:
        result = await db.execute(select(Lesson).where(Lesson.id == body.lesson_id))
        lesson = result.scalar_one_or_none()
        if lesson:
            lesson_context = lesson.content_markdown

    try:
        answer = await get_ai_tutor_response(
            question=body.question,
            subject=body.subject,
            lesson_context=lesson_context,
            language=body.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return TutorChatResponse(
        answer=answer,
        subject=body.subject,
        model_used="gemini-2.5-flash",
    )


@router.post(
    "/hint",
    response_model=HintResponse,
    summary="Imtihon maslahat (gemini-2.0-flash-lite)",
    description=(
        "Imtihon davomida savol bo'yicha to'g'ri javobni bildirmasdan maslahat beradi. "
        "Gemini 2.0 Flash Lite — cheksiz so'rovlar, bir zumda javob."
    ),
)
async def get_hint(
    body: HintRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HintResponse:
    result = await db.execute(select(Question).where(Question.id == body.question_id))
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Savol topilmadi.")

    options = {
        "A": question.option_a,
        "B": question.option_b,
        "C": question.option_c,
        "D": question.option_d,
    }

    try:
        hint = await get_exam_hint(
            question_text=question.question_text,
            subject=question.subject.value,
            options=options,
            language=body.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return HintResponse(
        hint=hint,
        question_id=body.question_id,
        model_used="gemini-2.0-flash-lite",
    )


@router.post(
    "/generate-question",
    response_model=GenerateQuestionResponse,
    summary="AI yordamida yangi savol yaratish — Admin (gemini-2.5-pro)",
    description=(
        "BMBA standartlariga mos yangi test savoli yaratadi. "
        "Gemini 2.5 Pro — eng yuqori sifat. "
        "Faqat admin foydalanuvchilar uchun (kelajakda role-based himoya)."
    ),
)
async def generate_question(
    body: GenerateQuestionRequest,
    current_user: User = Depends(get_admin_user),
) -> GenerateQuestionResponse:
    try:
        result = await generate_question_with_ai(
            subject=body.subject,
            topic=body.topic,
            difficulty=body.difficulty,
            is_competency_based=body.is_competency_based,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return GenerateQuestionResponse(
        **result,
        subject=body.subject,
        difficulty=body.difficulty,
        is_competency_based=body.is_competency_based,
        model_used="gemini-2.5-pro",
        note=(
            "Bu savol AI tomonidan yaratilgan. "
            "Ma'lumotlar bazasiga qo'shishdan oldin ekspert tomonidan ko'rib chiqilishi kerak."
        ),
    )
