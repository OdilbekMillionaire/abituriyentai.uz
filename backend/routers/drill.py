"""
Spaced-repetition drill mode.

Algorithm: simplified SM-2
  quality 0-2 → wrong  (reset interval=1, ease_factor -= 0.2, min 1.3)
  quality 3-5 → correct (interval grows, ease_factor adjusts)

Endpoints:
  GET  /drill/due          — next N due questions for this user
  POST /drill/answer       — record a drill answer, update SM-2 state
  GET  /drill/stats        — summary: total cards, due today, streak accuracy
"""

from datetime import date, datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.drill_card import DrillCard
from models.question import Question, Subject
from models.user import User
from routers.auth import get_current_user

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────

class DrillQuestionOut(BaseModel):
    card_id: int
    question_id: int
    subject: Subject
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    tags: list[str] | None
    era_tag: str | None
    # SM-2 metadata (shown in UI)
    interval: int
    repetitions: int
    ease_factor: float
    total_answers: int
    correct_answers: int

    model_config = {"from_attributes": True}


class DrillAnswerRequest(BaseModel):
    card_id: int
    selected_option: str = Field(..., pattern="^[A-Da-d]$")


class DrillAnswerResult(BaseModel):
    card_id: int
    question_id: int
    is_correct: bool
    correct_option: str
    explanation: str
    next_review_in_days: int
    new_ease_factor: float
    xp_earned: int


class DrillStatsOut(BaseModel):
    total_cards: int
    due_today: int
    mastered: int          # interval >= 21 days
    total_answers: int
    correct_answers: int
    accuracy_pct: float


# ── SM-2 logic ─────────────────────────────────────────────────────────────────

def _sm2_update(card: DrillCard, correct: bool) -> None:
    """
    Mutate card's SM-2 fields in-place.
    quality: 4 = perfect, 2 = correct-but-hard, 0 = complete blackout
    """
    quality = 4 if correct else 1

    if correct:
        if card.repetitions == 0:
            new_interval = 1
        elif card.repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(card.interval * card.ease_factor)
        card.repetitions += 1
    else:
        new_interval = 1
        card.repetitions = 0

    new_ef = card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    card.ease_factor = max(1.3, round(new_ef, 2))
    card.interval = new_interval
    card.next_review_at = date.today() + timedelta(days=new_interval)
    card.last_reviewed_at = datetime.now(timezone.utc)
    card.total_answers += 1
    if correct:
        card.correct_answers += 1


# ── Due queue ──────────────────────────────────────────────────────────────────

@router.get("/due", response_model=list[DrillQuestionOut], summary="Bugun ko'rib chiqiladigan savollar")
async def get_due_cards(
    subject: str | None = Query(None, description="mother_tongue | mathematics | history"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DrillQuestionOut]:
    subject_map = {
        "mother_tongue": Subject.MOTHER_TONGUE,
        "mathematics":   Subject.MATHEMATICS,
        "history":       Subject.HISTORY,
    }

    today = date.today()

    # Load existing due cards
    stmt = (
        select(DrillCard)
        .options(selectinload(DrillCard.question))
        .where(
            DrillCard.user_id == current_user.id,
            DrillCard.next_review_at <= today,
        )
    )
    if subject and subject in subject_map:
        stmt = stmt.join(DrillCard.question).where(Question.subject == subject_map[subject])

    stmt = stmt.order_by(DrillCard.next_review_at.asc()).limit(limit)
    result = await db.execute(stmt)
    due_cards = list(result.scalars().all())

    # If fewer than requested, seed new cards from question bank
    needed = limit - len(due_cards)
    if needed > 0:
        existing_ids_stmt = select(DrillCard.question_id).where(DrillCard.user_id == current_user.id)
        existing_ids_res = await db.execute(existing_ids_stmt)
        existing_ids = {row[0] for row in existing_ids_res.fetchall()}

        new_q_stmt = select(Question).where(Question.id.notin_(existing_ids))
        if subject and subject in subject_map:
            new_q_stmt = new_q_stmt.where(Question.subject == subject_map[subject])
        new_q_stmt = new_q_stmt.order_by(func.random()).limit(needed)
        new_q_res = await db.execute(new_q_stmt)
        new_questions = list(new_q_res.scalars().all())

        for q in new_questions:
            card = DrillCard(
                user_id=current_user.id,
                question_id=q.id,
                next_review_at=today,
            )
            db.add(card)
            await db.flush()
            await db.refresh(card)
            card.question = q
            due_cards.append(card)

    return [
        DrillQuestionOut(
            card_id=c.id,
            question_id=c.question.id,
            subject=c.question.subject,
            question_text=c.question.question_text,
            option_a=c.question.option_a,
            option_b=c.question.option_b,
            option_c=c.question.option_c,
            option_d=c.question.option_d,
            tags=c.question.tags,
            era_tag=c.question.era_tag,
            interval=c.interval,
            repetitions=c.repetitions,
            ease_factor=c.ease_factor,
            total_answers=c.total_answers,
            correct_answers=c.correct_answers,
        )
        for c in due_cards
    ]


# ── Answer ─────────────────────────────────────────────────────────────────────

@router.post("/answer", response_model=DrillAnswerResult, summary="Drill savoliga javob berish")
async def answer_card(
    payload: DrillAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrillAnswerResult:
    result = await db.execute(
        select(DrillCard)
        .options(selectinload(DrillCard.question))
        .where(
            DrillCard.id == payload.card_id,
            DrillCard.user_id == current_user.id,
        )
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Drill karta topilmadi.")

    q = card.question
    is_correct = payload.selected_option.upper() == q.correct_option.upper()

    _sm2_update(card, is_correct)
    await db.flush()

    # Small XP reward for drilling
    xp_earned = 5 if is_correct else 2
    current_user.xp += xp_earned
    await db.flush()

    return DrillAnswerResult(
        card_id=card.id,
        question_id=q.id,
        is_correct=is_correct,
        correct_option=q.correct_option,
        explanation=q.explanation or "",
        next_review_in_days=card.interval,
        new_ease_factor=card.ease_factor,
        xp_earned=xp_earned,
    )


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DrillStatsOut, summary="Drill statistikasi")
async def drill_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrillStatsOut:
    today = date.today()

    total_res = await db.execute(
        select(func.count()).where(DrillCard.user_id == current_user.id)
    )
    total_cards = total_res.scalar() or 0

    due_res = await db.execute(
        select(func.count()).where(
            DrillCard.user_id == current_user.id,
            DrillCard.next_review_at <= today,
        )
    )
    due_today = due_res.scalar() or 0

    mastered_res = await db.execute(
        select(func.count()).where(
            DrillCard.user_id == current_user.id,
            DrillCard.interval >= 21,
        )
    )
    mastered = mastered_res.scalar() or 0

    sums_res = await db.execute(
        select(
            func.coalesce(func.sum(DrillCard.total_answers), 0),
            func.coalesce(func.sum(DrillCard.correct_answers), 0),
        ).where(DrillCard.user_id == current_user.id)
    )
    total_ans, correct_ans = sums_res.one()

    accuracy = round((correct_ans / total_ans * 100), 1) if total_ans else 0.0

    return DrillStatsOut(
        total_cards=total_cards,
        due_today=due_today,
        mastered=mastered,
        total_answers=total_ans,
        correct_answers=correct_ans,
        accuracy_pct=accuracy,
    )
