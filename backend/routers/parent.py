"""
Parent / Teacher access router.

Allows students to generate a time-limited share token,
and parents/teachers to view student progress read-only via that token.

No additional DB tables needed — the token is an HMAC-signed
payload of the student's user_id + expiry, verifiable without storage.
"""
import base64
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.user import User
from models.user_progress import UserProgress
from models.exam_session import ExamSession, SessionStatus
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

_PARENT_SECRET = "parent_view_v1"  # namespaced from the main secret key


# ── Token helpers ──────────────────────────────────────────────────────────────

def _make_token(user_id: int, expires_in_days: int = 30) -> str:
    """Create an HMAC share token for a student with configurable expiry."""
    exp_ts = int((datetime.now(timezone.utc) + timedelta(days=expires_in_days)).timestamp())
    payload = json.dumps({"uid": user_id, "ns": _PARENT_SECRET, "exp": exp_ts}).encode()
    key = (settings.secret_key + _PARENT_SECRET).encode()
    sig = hmac.new(key, payload, hashlib.sha256).hexdigest()[:16]
    raw = base64.urlsafe_b64encode(payload).decode() + "." + sig
    return raw


def _verify_token(token: str) -> int | None:
    """
    Verify a share token and return the user_id.
    Returns None if invalid or expired.
    """
    try:
        encoded, sig = token.rsplit(".", 1)
        payload = base64.urlsafe_b64decode(encoded.encode())
        key = (settings.secret_key + _PARENT_SECRET).encode()
        expected = hmac.new(key, payload, hashlib.sha256).hexdigest()[:16]
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(payload)
        if data.get("ns") != _PARENT_SECRET:
            return None
        # Check expiry
        exp = data.get("exp")
        if exp and datetime.now(timezone.utc).timestamp() > exp:
            return None  # Token expired
        return int(data["uid"])
    except Exception:
        return None


def _token_expires_at(token: str) -> str | None:
    """Extract expiry date from token as ISO string."""
    try:
        encoded, _ = token.rsplit(".", 1)
        payload = base64.urlsafe_b64decode(encoded.encode())
        data = json.loads(payload)
        exp = data.get("exp")
        if exp:
            return datetime.fromtimestamp(exp, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        pass
    return None


# ── Schemas ────────────────────────────────────────────────────────────────────

class ShareTokenResponse(BaseModel):
    token: str
    student_name: str
    share_url: str
    expires_at: str | None = None


class StudentPublicProfile(BaseModel):
    username: str
    level: int
    streak_days: int
    xp: int
    coins: int
    oxforder_tanga: int
    exams_taken: int
    lessons_completed: int
    average_score: float
    best_score: float
    created_at: str
    recent_activity: list[dict]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get(
    "/my-token",
    response_model=ShareTokenResponse,
    summary="O'quvchining ota-ona/o'qituvchi uchun ulashish tokenini olish",
)
async def get_my_share_token(
    expires_in_days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
) -> ShareTokenResponse:
    """Returns a share token valid for `expires_in_days` days."""
    token = _make_token(current_user.id, expires_in_days=expires_in_days)
    expires_at = _token_expires_at(token)
    base_url = "https://abituriyentai.uz"
    return ShareTokenResponse(
        token=token,
        student_name=current_user.username,
        share_url=f"{base_url}/parent/student/{token}",
        expires_at=expires_at,
    )


@router.get(
    "/student/{token}",
    response_model=StudentPublicProfile,
    summary="Token orqali o'quvchi profilini ko'rish (ochiq, autentifikatsiyasiz)",
)
async def view_student_progress(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> StudentPublicProfile:
    """
    Public endpoint — no authentication required.
    Parents/teachers access this with the student's share token.
    """
    user_id = _verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=403, detail="Token noto'g'ri yoki muddati o'tgan.")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")

    # Exam stats
    sessions_result = await db.execute(
        select(ExamSession).where(
            ExamSession.user_id == user.id,
            ExamSession.status == SessionStatus.SUBMITTED,
        ).order_by(ExamSession.submitted_at.desc()).limit(20)
    )
    sessions = sessions_result.scalars().all()
    scores = [s.total_score for s in sessions if s.total_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    best_score = round(max(scores), 1) if scores else 0.0

    # Lessons
    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user.id)
    )
    lessons_completed = len(progress_result.scalars().all())

    # Recent activity (last 5 exams)
    recent_activity = [
        {
            "date": (s.submitted_at or s.started_at).strftime("%Y-%m-%d") if (s.submitted_at or s.started_at) else "—",
            "score": round(s.total_score, 1) if s.total_score else 0,
            "percentage": round((s.total_score / 33) * 100, 1) if s.total_score else 0,
        }
        for s in sessions[:5]
    ]

    return StudentPublicProfile(
        username=user.username,
        level=user.level,
        streak_days=user.streak_days,
        xp=user.xp,
        coins=user.coins,
        oxforder_tanga=user.oxforder_tanga,
        exams_taken=len(sessions),
        lessons_completed=lessons_completed,
        average_score=avg_score,
        best_score=best_score,
        created_at=user.created_at.strftime("%Y-%m-%d"),
        recent_activity=recent_activity,
    )
