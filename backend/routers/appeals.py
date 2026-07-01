"""
Appeals router — "Abituriyent Huquqlari" (Rights of Applicant) feature.

Allows students to appeal / request an explanation for any question.
Returns the correct answer explanation and the source Ministry of Education decree.
Powered by Gemini 2.5 Pro for legally-grounded, authoritative explanations.
This is the unique legal-differentiator feature of AbituriyentAI.
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.question import Question
from models.user import User
from routers.auth import get_current_user
from services.ai_service import get_ai_appeal_explanation

logger = logging.getLogger(__name__)

router = APIRouter()

# Default decree citation when no specific one is stored on the question.
# References the UzBMB 2026 Regulation on Competency-Based Assessment.
DEFAULT_DECREE = (
    "O'zbekiston Respublikasi Vazirlar Mahkamasi 2024-yil 14-martdagi "
    "«Oliy ta'limga qabul qilish tartibi to'g'risida»gi 138-sonli Qaror, "
    "BMBA 2026 Namunaviy Test Topshiriqlari To'plami §3.1"
)

SUBJECT_DECREE: dict[str, str] = {
    "MOTHER_TONGUE": (
        "O'zbekiston Respublikasi Xalq ta'limi vazirligi 2023-yil 30-avgustdagi "
        "«Ona tili va adabiyot o'quv dasturi standartlari» 312-sonli Buyruq §2.4"
    ),
    "MATHEMATICS": (
        "O'zbekiston Respublikasi Xalq ta'limi vazirligi 2023-yil 30-avgustdagi "
        "«Matematika o'quv dasturi standartlari (mantiqiy kompetensiya)» 312-sonli Buyruq §3.7"
    ),
    "HISTORY": (
        "O'zbekiston Respublikasi Prezidentining 2022-yil 28-yanvardagi "
        "«Yangi O'zbekiston» Taraqqiyot Strategiyasi PF-60 va "
        "BMBA 2026 O'zbekiston Tarixi Test Topshiriqlari To'plami §5.2"
    ),
}


class AppealResponse(BaseModel):
    question_id: int
    question_text: str
    correct_option: str
    correct_answer_text: str
    explanation: str
    ai_explanation: str | None = None          # Gemini 2.5 Pro deep explanation
    source_decree: str
    subject: str
    is_competency_based: bool
    appeal_timestamp: datetime
    ai_model_used: str | None = None


class AppealListItem(BaseModel):
    question_id: int
    subject: str
    question_preview: str
    correct_option: str


@router.post(
    "/question/{question_id}",
    response_model=AppealResponse,
    summary="Savol bo'yicha rasmiy tushuntirish va manba hujjatini olish (AI-powered)",
    description=(
        "Abituriyent imtihon savolini murojaat qiladi. "
        "Gemini 2.5 Pro yordamida to'g'ri javob tushuntirishini va BMBA manba hujjatini qaytaradi. "
        "Bu 'Abituriyent Huquqlari' funksiyasi — har bir o'quvchi to'g'ri javob asosini "
        "rasmiy hujjat bilan tekshirish huquqiga ega (BMBA 2026 §1.8). "
        "use_ai=true parametri bilan Gemini 2.5 Pro dan batafsil sharh olish mumkin."
    ),
)
async def appeal_question(
    question_id: int,
    use_ai: bool = Query(True, description="Gemini 2.5 Pro yordamida chuqur tushuntirish olish"),
    language: str = Query("uz", pattern="^(uz|ru)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppealResponse:
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Savol #{question_id} topilmadi.",
        )

    # Resolve the answer text from the correct option letter
    option_map = {
        "A": question.option_a,
        "B": question.option_b,
        "C": question.option_c,
        "D": question.option_d,
    }
    correct_text = option_map.get(question.correct_option.upper(), "Noma'lum")

    # Determine source decree: question-specific overrides subject default
    if question.source_decree:
        decree = question.source_decree
    else:
        decree = SUBJECT_DECREE.get(question.subject.value, DEFAULT_DECREE)

    # Build rich explanation combining question explanation + competency note
    explanation = question.explanation
    if question.is_competency_based:
        explanation += (
            "\n\n**Kompetensiyaga asoslangan savol (BMBA 2026):** "
            "Bu savol O'zMB baholash standartlari bo'yicha o'quvchining "
            "tahlil qilish, qo'llash va baholash kompetensiyalarini sinaydi."
        )
    if question.era_tag:
        era_labels = {
            "ANCIENT":        "Qadimgi davr",
            "MEDIEVAL":       "O'rta asrlar",
            "COLONIAL":       "Mustamlaka davri",
            "SOVIET":         "Sovet davri",
            "INDEPENDENCE":   "Mustaqillik davri",
            "NEW_UZBEKISTAN": "Yangi O'zbekiston davri (2017–hozir)",
        }
        era_label = era_labels.get(question.era_tag, question.era_tag)
        explanation += f"\n\n**Tarixiy davr:** {era_label}"

    # ── Gemini 2.5 Pro: AI-powered deep explanation ───────────────────────────
    ai_explanation: str | None = None
    ai_model_used: str | None = None

    if use_ai:
        try:
            ai_explanation = await get_ai_appeal_explanation(
                question_text=question.question_text,
                correct_option=question.correct_option.upper(),
                correct_answer_text=correct_text,
                subject=question.subject.value,
                existing_explanation=explanation,
                is_competency_based=question.is_competency_based,
                source_decree=decree,
                language=language,
            )
            ai_model_used = "gemini-2.5-pro"
        except RuntimeError as exc:
            # Non-fatal: fall back to static explanation if AI fails
            logger.warning("AI appeal explanation failed, using static: %s", exc)

    return AppealResponse(
        question_id=question.id,
        question_text=question.question_text,
        correct_option=question.correct_option.upper(),
        correct_answer_text=correct_text,
        explanation=explanation,
        ai_explanation=ai_explanation,
        source_decree=decree,
        subject=question.subject.value,
        is_competency_based=question.is_competency_based,
        appeal_timestamp=datetime.now(timezone.utc),
        ai_model_used=ai_model_used,
    )


@router.get(
    "/questions",
    response_model=list[AppealListItem],
    summary="Murojaat qilish mumkin bo'lgan savollar ro'yxati",
)
async def list_appealable_questions(
    subject: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AppealListItem]:
    from models.question import Subject

    stmt = select(Question).limit(min(limit, 200))
    if subject:
        subject_map = {
            "mother_tongue": Subject.MOTHER_TONGUE,
            "mathematics":   Subject.MATHEMATICS,
            "history":       Subject.HISTORY,
        }
        subj = subject_map.get(subject)
        if subj:
            stmt = stmt.where(Question.subject == subj)

    result = await db.execute(stmt)
    questions = result.scalars().all()

    return [
        AppealListItem(
            question_id=q.id,
            subject=q.subject.value,
            question_preview=q.question_text[:100] + ("..." if len(q.question_text) > 100 else ""),
            correct_option=q.correct_option.upper(),
        )
        for q in questions
    ]
