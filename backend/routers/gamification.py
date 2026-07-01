from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from cache import cache_get, cache_set, cache_delete_prefix
from config import settings
from database import get_db
from models.user import User
from models.exam_session import ExamSession, SessionStatus
from routers.auth import get_current_user
from schemas.user import UserProfile
from services.gamification import award_xp, award_coins, update_streak, compute_level

router = APIRouter()


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    xp: int
    level: int
    streak_days: int


class DailyCheckinResponse(BaseModel):
    message: str
    tanga_earned: int
    streak_days: int
    new_total_tanga: int
    oxforder_tanga: int
    bonus_awarded: bool


class UserStatsResponse(BaseModel):
    profile: UserProfile
    exams_taken: int
    lessons_completed: int
    average_score: float
    best_score: float


@router.get(
    "/profile",
    response_model=UserProfile,
    summary="Foydalanuvchi profili va gamification statistikasi",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> UserProfile:
    xp_in_level = current_user.xp % settings.xp_per_level
    xp_to_next = settings.xp_per_level - xp_in_level
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        coins=current_user.coins,
        oxforder_tanga=current_user.oxforder_tanga,
        last_active_date=current_user.last_active_date,
        created_at=current_user.created_at,
        xp_to_next_level=xp_to_next,
        xp_in_current_level=xp_in_level,
    )


@router.get(
    "/leaderboard",
    response_model=list[LeaderboardEntry],
    summary="Top foydalanuvchilar reytingi (XP bo'yicha)",
)
async def leaderboard(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LeaderboardEntry]:
    cache_key = f"leaderboard_{min(limit, 100)}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    result = await db.execute(
        select(User).order_by(User.xp.desc()).limit(min(limit, 100))
    )
    users = result.scalars().all()

    entries = [
        LeaderboardEntry(
            rank=idx + 1,
            username=user.username,
            xp=user.xp,
            level=user.level,
            streak_days=user.streak_days,
        )
        for idx, user in enumerate(users)
    ]
    cache_set(cache_key, entries, ttl_seconds=300)
    return entries


@router.post(
    "/daily-checkin",
    response_model=DailyCheckinResponse,
    summary="Kunlik kirish bonusi (streak va tangalar)",
)
async def daily_checkin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DailyCheckinResponse:
    today = date.today()

    if current_user.last_active_date == today:
        return DailyCheckinResponse(
            message="Siz bugun allaqachon kirish bonusini oldingiz.",
            tanga_earned=0,
            streak_days=current_user.streak_days,
            new_total_tanga=current_user.coins,
            oxforder_tanga=current_user.oxforder_tanga,
            bonus_awarded=False,
        )

    tanga_to_award = 5  # base daily check-in reward
    bonus_awarded = False

    await update_streak(current_user, db)

    # Streak milestone bonus
    if current_user.streak_days % settings.streak_bonus_days_threshold == 0:
        tanga_to_award += settings.streak_bonus_coins
        bonus_awarded = True

    await award_coins(current_user, tanga_to_award, db)
    await db.flush()
    cache_delete_prefix("leaderboard_")  # Invalidate leaderboard cache after check-in

    msg = f"{current_user.streak_days} kunlik streak! +{tanga_to_award} Tanga oldingiz."
    if bonus_awarded:
        msg += f" Streak bonus: +{settings.streak_bonus_coins} Tanga!"

    return DailyCheckinResponse(
        message=msg,
        tanga_earned=tanga_to_award,
        streak_days=current_user.streak_days,
        new_total_tanga=current_user.coins,
        oxforder_tanga=current_user.oxforder_tanga,
        bonus_awarded=bonus_awarded,
    )


@router.get(
    "/stats",
    response_model=UserStatsResponse,
    summary="Foydalanuvchining batafsil statistikasi",
)
async def user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserStatsResponse:
    from models.user_progress import UserProgress

    # Exam stats
    sessions_result = await db.execute(
        select(ExamSession).where(
            ExamSession.user_id == current_user.id,
            ExamSession.status == SessionStatus.SUBMITTED,
        )
    )
    sessions = sessions_result.scalars().all()
    exams_taken = len(sessions)
    scores = [s.total_score for s in sessions if s.total_score is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    best_score = round(max(scores), 2) if scores else 0.0

    # Lesson stats
    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == current_user.id)
    )
    lessons_completed = len(progress_result.scalars().all())

    xp_in_level = current_user.xp % settings.xp_per_level
    xp_to_next = settings.xp_per_level - xp_in_level

    profile = UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        coins=current_user.coins,
        oxforder_tanga=current_user.oxforder_tanga,
        last_active_date=current_user.last_active_date,
        created_at=current_user.created_at,
        xp_to_next_level=xp_to_next,
        xp_in_current_level=xp_in_level,
    )

    return UserStatsResponse(
        profile=profile,
        exams_taken=exams_taken,
        lessons_completed=lessons_completed,
        average_score=avg_score,
        best_score=best_score,
    )


# ── Progress history ───────────────────────────────────────────────────────────

class ProgressDataPoint(BaseModel):
    date: str          # ISO date string
    total_pct: float
    mt_pct: float
    math_pct: float
    history_pct: float
    total_score: float


class ProgressHistoryResponse(BaseModel):
    points: list[ProgressDataPoint]
    best_score: float
    average_score: float
    trend: str         # "improving" | "stable" | "declining" | "insufficient_data"


@router.get(
    "/progress-history",
    response_model=ProgressHistoryResponse,
    summary="Vaqt o'tishi bilan natijalar dinamikasi",
)
async def progress_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProgressHistoryResponse:
    from sqlalchemy import func as sqlfunc
    from config import settings as cfg

    result = await db.execute(
        select(ExamSession)
        .where(
            ExamSession.user_id == current_user.id,
            ExamSession.status == SessionStatus.SUBMITTED,
            ExamSession.total_score.isnot(None),
        )
        .order_by(ExamSession.submitted_at.asc())
        .limit(50)
    )
    sessions = result.scalars().all()

    max_score = cfg.max_exam_score or 33.0
    max_per = cfg.questions_per_subject * cfg.points_per_correct

    points: list[ProgressDataPoint] = []
    for s in sessions:
        dt = (s.submitted_at or s.started_at)
        total_pct = round((s.total_score / max_score) * 100, 1) if max_score else 0.0
        mt_pct = round(((s.mother_tongue_score or 0) / max_per) * 100, 1) if max_per else 0.0
        math_pct = round(((s.math_score or 0) / max_per) * 100, 1) if max_per else 0.0
        hist_pct = round(((s.history_score or 0) / max_per) * 100, 1) if max_per else 0.0
        points.append(ProgressDataPoint(
            date=dt.strftime("%Y-%m-%d") if dt else "unknown",
            total_pct=total_pct,
            mt_pct=mt_pct,
            math_pct=math_pct,
            history_pct=hist_pct,
            total_score=round(s.total_score, 2),
        ))

    scores = [p.total_pct for p in points]
    best = round(max(scores), 1) if scores else 0.0
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Trend: compare first half avg vs second half avg
    if len(scores) < 3:
        trend = "insufficient_data"
    else:
        mid = len(scores) // 2
        first_avg = sum(scores[:mid]) / mid
        second_avg = sum(scores[mid:]) / (len(scores) - mid)
        diff = second_avg - first_avg
        trend = "improving" if diff >= 3 else "declining" if diff <= -3 else "stable"

    return ProgressHistoryResponse(
        points=points,
        best_score=best,
        average_score=avg,
        trend=trend,
    )


# ── Weak-area analytics ────────────────────────────────────────────────────────

class TopicPerformance(BaseModel):
    tag: str
    subject: str
    correct: int
    total: int
    accuracy: float          # 0.0 – 1.0
    is_weak: bool            # True if accuracy < 0.6


class WeakAreasResponse(BaseModel):
    topics: list[TopicPerformance]
    total_answers_analyzed: int


@router.get(
    "/weak-areas",
    response_model=WeakAreasResponse,
    summary="Zaif mavzularni aniqlash (barcha imtihon javoblari tahlili)",
)
async def weak_areas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WeakAreasResponse:
    """
    Analyses every exam answer the student has given.
    Groups by question tag and returns accuracy per tag.
    Flags tags where accuracy < 60% as 'weak'.
    """
    rows = await db.execute(
        text("""
            SELECT
                q.tags,
                q.subject,
                ea.is_correct
            FROM exam_answers ea
            JOIN exam_sessions es ON ea.session_id = es.id
            JOIN questions q      ON ea.question_id = q.id
            WHERE es.user_id   = :uid
              AND es.status    = 'SUBMITTED'
              AND q.tags       IS NOT NULL
              AND q.tags       != 'null'
        """),
        {"uid": current_user.id},
    )
    answer_rows = rows.fetchall()

    # Aggregate: tag → {correct, total}
    import json as _json
    tag_stats: dict[str, dict] = {}   # key = "SUBJECT::TAG"

    for tags_raw, subject, is_correct in answer_rows:
        # tags_raw may come back as str or list depending on driver
        if isinstance(tags_raw, str):
            try:
                tags = _json.loads(tags_raw)
            except Exception:
                continue
        else:
            tags = tags_raw or []

        for tag in tags:
            key = f"{subject}::{tag}"
            if key not in tag_stats:
                tag_stats[key] = {"subject": subject, "tag": tag, "correct": 0, "total": 0}
            tag_stats[key]["total"] += 1
            if is_correct:
                tag_stats[key]["correct"] += 1

    topics: list[TopicPerformance] = []
    for stats in tag_stats.values():
        if stats["total"] == 0:
            continue
        accuracy = stats["correct"] / stats["total"]
        topics.append(TopicPerformance(
            tag=stats["tag"],
            subject=stats["subject"],
            correct=stats["correct"],
            total=stats["total"],
            accuracy=round(accuracy, 3),
            is_weak=accuracy < 0.6,
        ))

    # Sort: weakest first, then by total attempts (more data = more reliable)
    topics.sort(key=lambda t: (not t.is_weak, t.accuracy, -t.total))

    return WeakAreasResponse(
        topics=topics,
        total_answers_analyzed=len(answer_rows),
    )


# ── Update profile ────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    username: str


@router.patch(
    "/profile",
    response_model=UserProfile,
    summary="Foydalanuvchi profilini yangilash",
)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfile:
    username = body.username.strip()
    if len(username) < 2:
        raise HTTPException(status_code=422, detail="Username kamida 2 ta belgi bo'lishi kerak")
    if len(username) > 50:
        raise HTTPException(status_code=422, detail="Username juda uzun")

    existing = await db.execute(
        select(User).where(User.username == username, User.id != current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bu username band")

    current_user.username = username
    await db.commit()
    await db.refresh(current_user)

    xp_in_level = current_user.xp % settings.xp_per_level
    xp_to_next = settings.xp_per_level - xp_in_level
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        coins=current_user.coins,
        oxforder_tanga=current_user.oxforder_tanga,
        last_active_date=current_user.last_active_date,
        created_at=current_user.created_at,
        xp_to_next_level=xp_to_next,
        xp_in_current_level=xp_in_level,
    )


# ── Chaqa → Tanga exchange ─────────────────────────────────────────────────────

CHAQA_PER_TANGA = 1000


class ExchangeResponse(BaseModel):
    message: str
    tangaEarned: int
    newCoins: int
    newTanga: int


@router.post(
    "/exchange-chaqa",
    response_model=ExchangeResponse,
    summary="1000 Chaqani 1 Tangaga almashtirish",
)
async def exchange_chaqa(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExchangeResponse:
    if current_user.coins < CHAQA_PER_TANGA:
        raise HTTPException(
            status_code=400,
            detail=f"Yetarli Chaqa yo'q. Kerak: {CHAQA_PER_TANGA}, Sizda: {current_user.coins}",
        )

    tanga_earned = current_user.coins // CHAQA_PER_TANGA
    chaqa_spent = tanga_earned * CHAQA_PER_TANGA

    current_user.coins -= chaqa_spent
    current_user.oxforder_tanga = (current_user.oxforder_tanga or 0) + tanga_earned
    await db.commit()
    await db.refresh(current_user)

    return ExchangeResponse(
        message=f"{chaqa_spent} Chaqa → {tanga_earned} Tanga almashtirildi!",
        tangaEarned=tanga_earned,
        newCoins=current_user.coins,
        newTanga=current_user.oxforder_tanga,
    )


# ── Award coins (for games) ────────────────────────────────────────────────────

class AwardCoinsRequest(BaseModel):
    coins: int
    source: str  # e.g. "game_speedquiz", "game_fillblank"


class AwardCoinsResponse(BaseModel):
    message: str
    coinsAwarded: int
    newTotal: int


@router.post(
    "/award-coins",
    response_model=AwardCoinsResponse,
    summary="O'yin yutug'i uchun Chaqa berish",
)
async def award_coins_endpoint(
    body: AwardCoinsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AwardCoinsResponse:
    amount = max(0, min(body.coins, 200))  # cap at 200 per call
    await award_coins(current_user, amount, db)
    await db.commit()
    await db.refresh(current_user)
    return AwardCoinsResponse(
        message=f"+{amount} Chaqa qo'shildi ({body.source})",
        coinsAwarded=amount,
        newTotal=current_user.coins,
    )
