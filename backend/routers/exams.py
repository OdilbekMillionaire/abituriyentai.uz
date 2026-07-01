from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from database import get_db
from models.exam_session import ExamSession, SessionStatus
from models.exam_answer import ExamAnswer
from models.question import Question, Subject
from models.user import User
from routers.auth import get_current_user
from schemas.exam import (
    ExamStartResponse,
    ExamQuestionOut,
    ExamSubmitRequest,
    ExamResultResponse,
    ExamReviewResponse,
    ExamReviewItem,
)
from services.scoring import compute_exam_score
from services.gamification import award_xp, award_coins, update_streak, compute_level

router = APIRouter()

SUBJECT_LABEL: dict[Subject, str] = {
    Subject.MOTHER_TONGUE: "Ona tili va adabiyot",
    Subject.MATHEMATICS:   "Matematika",
    Subject.HISTORY:       "O'zbekiston tarixi",
}


# ── Start exam ────────────────────────────────────────────────────────────────

DTM_SIMULYATSIYA_MINUTES = 45  # Real DTM mandatory block time limit


@router.get(
    "/start",
    response_model=ExamStartResponse,
    summary="Yangi imtihon sessiyasini boshlash",
)
async def start_exam(
    subject: str = Query(
        default="all",
        description="all | mother_tongue | mathematics | history",
    ),
    mode: str = Query(
        default="practice",
        description="practice | simulyatsiya — simulyatsiya forces all subjects, 45 min",
    ),
    time_limit_minutes: int = Query(
        default=0,
        ge=0,
        description="Custom time limit in minutes (10–60). 0 = use default. Ignored in simulyatsiya mode.",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExamStartResponse:
    subject_map = {
        "mother_tongue": Subject.MOTHER_TONGUE,
        "mathematics":   Subject.MATHEMATICS,
        "history":       Subject.HISTORY,
    }

    # Simulyatsiya mode always uses all 3 subjects and 45-minute time limit
    is_simulyatsiya = mode == "simulyatsiya"
    if is_simulyatsiya or subject == "all":
        subjects_included = list(Subject)
        questions_needed_per_subject = settings.questions_per_subject
    elif subject in subject_map:
        subjects_included = [subject_map[subject]]
        questions_needed_per_subject = settings.questions_per_subject
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="subject parametri: all, mother_tongue, mathematics yoki history bo'lishi kerak.",
        )

    # Fetch random questions per subject
    all_questions: list[Question] = []
    for subj in subjects_included:
        result = await db.execute(
            select(Question)
            .where(Question.subject == subj)
            .order_by(__import__("sqlalchemy").func.random())
            .limit(questions_needed_per_subject)
        )
        questions = list(result.scalars().all())
        if len(questions) < questions_needed_per_subject:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"{SUBJECT_LABEL[subj]} fanidan yetarli savol topilmadi. "
                    f"Kerak: {questions_needed_per_subject}, mavjud: {len(questions)}."
                ),
            )
        all_questions.extend(questions)

    if is_simulyatsiya:
        time_limit = DTM_SIMULYATSIYA_MINUTES
    elif time_limit_minutes > 0:
        time_limit = max(10, min(60, time_limit_minutes))
    else:
        time_limit = settings.exam_time_limit_minutes

    # Create session
    session = ExamSession(
        user_id=current_user.id,
        time_limit_minutes=time_limit,
        status=SessionStatus.IN_PROGRESS,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    return ExamStartResponse(
        session_id=session.id,
        questions=[ExamQuestionOut.model_validate(q) for q in all_questions],
        time_limit_minutes=session.time_limit_minutes,
        started_at=session.started_at,
        total_questions=len(all_questions),
        subjects_included=subjects_included,
    )


# ── Submit exam ───────────────────────────────────────────────────────────────

@router.post(
    "/submit",
    response_model=ExamResultResponse,
    summary="Imtihon javoblarini topshirish va natijalarni hisoblash",
)
async def submit_exam(
    payload: ExamSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExamResultResponse:
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.answers))
        .where(
            ExamSession.id == payload.session_id,
            ExamSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessiya topilmadi.")

    if session.status == SessionStatus.SUBMITTED:
        # Idempotent: already submitted — reload answers and return existing result
        answers_result = await db.execute(
            select(ExamAnswer).where(ExamAnswer.session_id == session.id)
        )
        existing_answers = answers_result.scalars().all()
        existing_q_ids = [a.question_id for a in existing_answers]
        eq_result = await db.execute(select(Question).where(Question.id.in_(existing_q_ids)))
        existing_qs_by_id: dict[int, Question] = {q.id: q for q in eq_result.scalars().all()}
        score_result = compute_exam_score(existing_answers, existing_qs_by_id)
        return _build_result_response(session, score_result, xp_earned=0, coins_earned=0)

    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu sessiya allaqachon yakunlangan.",
        )

    # Check time limit — auto-expire if exceeded
    now = datetime.now(timezone.utc)
    elapsed_minutes = (now - session.started_at.replace(tzinfo=timezone.utc)).seconds / 60
    if elapsed_minutes > session.time_limit_minutes:
        session.status = SessionStatus.EXPIRED
        session.submitted_at = now
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Imtihon vaqti tugagan. Sessiya yakunlandi.",
        )

    # Load questions to verify answers
    question_ids = [a.question_id for a in payload.answers]
    q_result = await db.execute(
        select(Question).where(Question.id.in_(question_ids))
    )
    questions_by_id: dict[int, Question] = {
        q.id: q for q in q_result.scalars().all()
    }

    # Persist answers
    exam_answers: list[ExamAnswer] = []
    for answer_submit in payload.answers:
        q = questions_by_id.get(answer_submit.question_id)
        if not q:
            continue

        is_correct = (
            answer_submit.selected_option is not None
            and answer_submit.selected_option.upper() == q.correct_option.upper()
        )
        points = settings.points_per_correct if is_correct else 0.0

        ea = ExamAnswer(
            session_id=session.id,
            question_id=q.id,
            selected_option=answer_submit.selected_option,
            is_correct=is_correct,
            points_earned=points,
        )
        db.add(ea)
        exam_answers.append(ea)

    # Compute scores
    score_result = compute_exam_score(exam_answers, questions_by_id)

    session.status = SessionStatus.SUBMITTED
    session.submitted_at = now
    session.total_score = score_result["total_score"]
    session.mother_tongue_score = score_result["mother_tongue_score"]
    session.math_score = score_result["math_score"]
    session.history_score = score_result["history_score"]
    await db.flush()

    # Award XP and coins
    xp_earned = settings.exam_completion_xp
    coins_earned = await award_xp(current_user, xp_earned, db)
    await update_streak(current_user, db)
    await db.flush()

    return _build_result_response(session, score_result, xp_earned, coins_earned)


# ── Results ───────────────────────────────────────────────────────────────────

@router.get(
    "/results/{session_id}",
    response_model=ExamResultResponse,
    summary="Imtihon natijalarini ko'rish",
)
async def get_results(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExamResultResponse:
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.answers).selectinload(ExamAnswer.question))
        .where(
            ExamSession.id == session_id,
            ExamSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessiya topilmadi.")

    if session.status == SessionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Imtihon hali yakunlanmagan.",
        )

    questions_by_id = {a.question_id: a.question for a in session.answers}
    score_result = compute_exam_score(session.answers, questions_by_id)

    return _build_result_response(session, score_result, xp_earned=0, coins_earned=0)


@router.get(
    "/{session_id}/review",
    response_model=ExamReviewResponse,
    summary="Imtihon javoblarini to'g'ri javoblar va tushuntirishlar bilan ko'rib chiqish",
)
async def get_review(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExamReviewResponse:
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.answers).selectinload(ExamAnswer.question))
        .where(
            ExamSession.id == session_id,
            ExamSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessiya topilmadi.")
    if session.status == SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Imtihon hali yakunlanmagan.")

    items = [
        ExamReviewItem(
            question_id=a.question.id,
            subject=a.question.subject,
            question_text=a.question.question_text,
            option_a=a.question.option_a,
            option_b=a.question.option_b,
            option_c=a.question.option_c,
            option_d=a.question.option_d,
            correct_option=a.question.correct_option,
            selected_option=a.selected_option,
            is_correct=a.is_correct,
            points_earned=a.points_earned,
            explanation=a.question.explanation or "",
            tags=a.question.tags,
            era_tag=a.question.era_tag,
        )
        for a in session.answers
    ]
    # Sort: wrong answers first, then by question_id for stable order
    items.sort(key=lambda x: (x.is_correct, x.question_id))

    return ExamReviewResponse(session_id=session_id, items=items)


@router.get(
    "/history",
    response_model=list[ExamResultResponse],
    summary="Foydalanuvchining barcha imtihon natijalari tarixi",
)
async def exam_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExamResultResponse]:
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.answers).selectinload(ExamAnswer.question))
        .where(
            ExamSession.user_id == current_user.id,
            ExamSession.status != SessionStatus.IN_PROGRESS,
        )
        .order_by(ExamSession.started_at.desc())
        .offset(skip)
        .limit(limit)
    )
    sessions = result.scalars().all()

    output = []
    for session in sessions:
        questions_by_id = {a.question_id: a.question for a in session.answers}
        score_result = compute_exam_score(session.answers, questions_by_id)
        output.append(_build_result_response(session, score_result, 0, 0))
    return output


@router.get(
    "/{session_id}/percentile",
    summary="Bu natija barcha foydalanuvchilar orasida qaysi foizda",
)
async def get_percentile(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    # Fetch the target session score
    res = await db.execute(
        select(ExamSession.total_score).where(
            ExamSession.id == session_id,
            ExamSession.user_id == current_user.id,
            ExamSession.status == SessionStatus.SUBMITTED,
        )
    )
    row = res.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Sessiya topilmadi.")
    my_score: float = row

    # Count all submitted scores
    all_res = await db.execute(
        select(ExamSession.total_score).where(
            ExamSession.status == SessionStatus.SUBMITTED,
            ExamSession.total_score.isnot(None),
        )
    )
    all_scores = [r[0] for r in all_res.fetchall()]

    if not all_scores:
        return {"percentile": 50, "total_participants": 1, "my_score": round(my_score, 2)}

    below = sum(1 for s in all_scores if s < my_score)
    percentile = round((below / len(all_scores)) * 100)

    return {
        "percentile": percentile,
        "total_participants": len(all_scores),
        "my_score": round(my_score, 2),
        "average_score": round(sum(all_scores) / len(all_scores), 2),
    }


# ── Internal builder ──────────────────────────────────────────────────────────

def _build_result_response(
    session: ExamSession,
    score_result: dict,
    xp_earned: int,
    coins_earned: int,
) -> ExamResultResponse:
    max_score = settings.max_exam_score
    total = score_result["total_score"]
    pct = round((total / max_score) * 100, 1) if max_score else 0.0

    if pct >= 90:
        grade = "A'lo"
    elif pct >= 75:
        grade = "Yaxshi"
    elif pct >= 55:
        grade = "Qoniqarli"
    else:
        grade = "Qoniqarsiz"

    questions_per = settings.questions_per_subject
    max_per = questions_per * settings.points_per_correct

    def build_breakdown(subject: Subject, score: float) -> dict:
        correct = round(score / settings.points_per_correct)
        return {
            "subject": subject,
            "subject_label": SUBJECT_LABEL[subject],
            "correct_count": correct,
            "total_questions": questions_per,
            "score": round(score, 2),
            "max_score": round(max_per, 2),
            "percentage": round((score / max_per) * 100, 1) if max_per else 0.0,
        }

    from schemas.exam import SubjectBreakdown, ExamResultResponse
    mt = SubjectBreakdown(**build_breakdown(Subject.MOTHER_TONGUE, score_result["mother_tongue_score"]))
    ma = SubjectBreakdown(**build_breakdown(Subject.MATHEMATICS,   score_result["math_score"]))
    hi = SubjectBreakdown(**build_breakdown(Subject.HISTORY,       score_result["history_score"]))

    total_correct = mt.correct_count + ma.correct_count + hi.correct_count

    return ExamResultResponse(
        session_id=session.id,
        status=session.status.value,
        started_at=session.started_at,
        submitted_at=session.submitted_at,
        total_score=round(total, 2),
        max_possible_score=round(max_score, 2),
        percentage=pct,
        grade_label=grade,
        mother_tongue_breakdown=mt,
        math_breakdown=ma,
        history_breakdown=hi,
        total_correct=total_correct,
        total_questions=questions_per * 3,
        xp_earned=xp_earned,
        coins_earned=coins_earned,
    )
