from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.lesson import Lesson
from models.user import User
from models.user_progress import UserProgress
from routers.auth import get_current_user
from schemas.lesson import LessonOut, LessonListItem, LessonCompleteResponse
from services.gamification import award_xp, award_coins, update_streak

router = APIRouter()


# ── Quiz Schemas ───────────────────────────────────────────────────────────────

class QuizOption(BaseModel):
    A: str
    B: str
    C: str
    D: str


class QuizQuestion(BaseModel):
    question: str
    options: QuizOption
    correct: str
    explanation: str


class LessonQuizResponse(BaseModel):
    lesson_id: int
    questions: list[QuizQuestion]


class LessonCompleteWithScoreRequest(BaseModel):
    quiz_score: float = Field(0.0, ge=0.0, le=1.0, description="Fraction of quiz questions answered correctly (0.0-1.0). Omit if no quiz taken.")
    language: str = Field("uzbek")


@router.get(
    "",
    response_model=list[LessonListItem],
    summary="Barcha darslar ro'yxati (fanga bo'linib)",
)
async def list_lessons(
    subject: str | None = Query(default=None, description="mother_tongue | mathematics | history"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LessonListItem]:
    from models.question import Subject

    stmt = select(Lesson).order_by(Lesson.subject, Lesson.order_index)

    if subject:
        subject_map = {
            "mother_tongue": Subject.MOTHER_TONGUE,
            "mathematics":   Subject.MATHEMATICS,
            "history":       Subject.HISTORY,
        }
        subj = subject_map.get(subject)
        if not subj:
            raise HTTPException(status_code=400, detail="Noto'g'ri fan nomi.")
        stmt = stmt.where(Lesson.subject == subj)

    result = await db.execute(stmt)
    lessons = result.scalars().all()

    # Get completed lesson IDs for this user
    progress_result = await db.execute(
        select(UserProgress.lesson_id).where(UserProgress.user_id == current_user.id)
    )
    completed_ids = set(progress_result.scalars().all())

    return [
        LessonListItem(
            **{
                "id": lesson.id,
                "subject": lesson.subject,
                "title": lesson.title,
                "order_index": lesson.order_index,
                "xp_reward": lesson.xp_reward,
                "era_tag": lesson.era_tag,
                "created_at": lesson.created_at,
                "is_completed": lesson.id in completed_ids,
            }
        )
        for lesson in lessons
    ]


@router.get(
    "/{lesson_id}",
    response_model=LessonOut,
    summary="Dars tafsilotlari va markdown mazmuni",
)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonOut:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi.")

    progress_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == lesson_id,
        )
    )
    is_completed = progress_result.scalar_one_or_none() is not None

    return LessonOut(
        id=lesson.id,
        subject=lesson.subject,
        title=lesson.title,
        content_markdown=lesson.content_markdown,
        order_index=lesson.order_index,
        xp_reward=lesson.xp_reward,
        era_tag=lesson.era_tag,
        created_at=lesson.created_at,
        is_completed=is_completed,
    )


@router.get(
    "/{lesson_id}/quiz",
    response_model=LessonQuizResponse,
    summary="Dars bo'yicha AI test savollari (3 ta)",
)
async def get_lesson_quiz(
    lesson_id: int,
    language: str = Query(default="uzbek"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonQuizResponse:
    from services.ai_service import generate_post_lesson_quiz

    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi.")

    try:
        questions_raw = await generate_post_lesson_quiz(
            lesson_content=lesson.content_markdown,
            topic=lesson.title,
            subject=lesson.subject.value,
            language=language,
            num_questions=3,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    questions = []
    for q in questions_raw[:3]:
        try:
            questions.append(QuizQuestion(
                question=q["question"],
                options=QuizOption(**q["options"]),
                correct=q["correct"],
                explanation=q.get("explanation", ""),
            ))
        except Exception:
            continue

    return LessonQuizResponse(lesson_id=lesson_id, questions=questions)


@router.post(
    "/{lesson_id}/complete",
    response_model=LessonCompleteResponse,
    summary="Darsni tugallash — quiz natijasi asosida Chaqa olish",
)
async def complete_lesson(
    lesson_id: int,
    body: LessonCompleteWithScoreRequest = LessonCompleteWithScoreRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonCompleteResponse:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi.")

    # Idempotent — don't double-award XP
    existing = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == lesson_id,
        )
    )
    if existing.scalar_one_or_none():
        return LessonCompleteResponse(
            lesson_id=lesson_id,
            xp_earned=0,
            new_total_xp=current_user.xp,
            new_level=current_user.level,
            coins_earned=0,
            message="Bu dars allaqachon tugallangan.",
        )

    progress = UserProgress(
        user_id=current_user.id,
        lesson_id=lesson_id,
        xp_earned=lesson.xp_reward,
    )
    db.add(progress)

    # Award XP (always full, for leveling)
    level_up_coins = await award_xp(current_user, lesson.xp_reward, db)
    await update_streak(current_user, db)

    # Award Chaqa proportional to quiz score (minimum 20% for attempting)
    # If no quiz (score=0.0 by default), still award a small base amount
    effective_score = max(0.2, body.quiz_score) if body.quiz_score > 0 else 0.2
    chaqa_from_quiz = round(lesson.xp_reward * effective_score)
    await award_coins(current_user, chaqa_from_quiz, db)

    total_coins = level_up_coins + chaqa_from_quiz
    await db.flush()

    pct = round(body.quiz_score * 100)
    msg = f"Tabriklaymiz! '{lesson.title}' darsini tugatdingiz."
    if body.quiz_score > 0:
        msg += f" Test natijai: {pct}% → +{chaqa_from_quiz} Chaqa!"
    else:
        msg += f" +{chaqa_from_quiz} Chaqa olindingiz!"

    return LessonCompleteResponse(
        lesson_id=lesson_id,
        xp_earned=lesson.xp_reward,
        new_total_xp=current_user.xp,
        new_level=current_user.level,
        coins_earned=total_coins,
        message=msg,
    )
