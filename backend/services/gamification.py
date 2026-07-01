"""
Gamification service for AbituriyentAI.

Handles XP, levels, streaks, Tanga, and Oxforder Tanga.

Coin system:
  - "Tanga"          — regular in-app currency (stored in users.coins)
  - "Oxforder Tanga" — premium currency (stored in users.oxforder_tanga)
                       Only obtainable by converting 1000 Tanga → 1 Oxforder Tanga.
                       Conversion is automatic when Tanga balance reaches ≥ 1000.

Other constants:
  - Level formula: level = floor(xp / 500) + 1
  - Streak bonus: every 3 days streak = +10 Tanga
  - Lesson XP: 50 XP
  - Exam completion XP: 100 XP
"""
from __future__ import annotations
import math
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings


def compute_level(xp: int) -> int:
    """
    Compute user level from total XP.
    Formula: level = floor(xp / 500) + 1
    """
    return math.floor(xp / settings.xp_per_level) + 1


def xp_for_level(level: int) -> int:
    """Return total XP needed to reach a given level."""
    return (level - 1) * settings.xp_per_level


def xp_progress_in_level(xp: int) -> tuple[int, int]:
    """
    Returns (xp_in_current_level, xp_to_next_level).
    Example: xp=750, xp_per_level=500 → (250, 250)
    """
    xp_in = xp % settings.xp_per_level
    xp_to_next = settings.xp_per_level - xp_in
    return xp_in, xp_to_next


def _apply_tanga_conversion(user: object) -> int:
    """
    Auto-convert every 1000 Tanga into 1 Oxforder Tanga.
    Modifies user.coins and user.oxforder_tanga in-place.
    Returns the number of Oxforder Tanga newly earned.
    """
    earned = user.coins // 1000  # type: ignore[attr-defined]
    if earned > 0:
        user.coins = user.coins % 1000          # type: ignore[attr-defined]
        user.oxforder_tanga += earned           # type: ignore[attr-defined]
    return earned


async def award_xp(user: object, xp_amount: int, db: AsyncSession) -> int:
    """
    Add XP to user, recompute level, and return Tanga earned from level-up bonuses.

    Returns:
        tanga_earned: Tanga awarded for level-ups (10 Tanga per level-up).
    """
    old_level = user.level  # type: ignore[attr-defined]
    user.xp += xp_amount    # type: ignore[attr-defined]
    new_level = compute_level(user.xp)  # type: ignore[attr-defined]

    tanga_earned = 0
    if new_level > old_level:
        level_ups = new_level - old_level
        # Award 10 Tanga per level gained
        tanga_earned = level_ups * 10
        user.coins += tanga_earned  # type: ignore[attr-defined]
        _apply_tanga_conversion(user)

    user.level = new_level  # type: ignore[attr-defined]
    return tanga_earned


async def award_coins(user: object, coins: int, db: AsyncSession) -> None:
    """Award Tanga to a user and auto-convert to Oxforder Tanga if threshold reached."""
    user.coins += coins  # type: ignore[attr-defined]
    _apply_tanga_conversion(user)


async def update_streak(user: object, db: AsyncSession) -> None:
    """
    Update user's daily streak.

    Rules:
      - If last_active_date is None or more than 1 day ago: reset streak to 1.
      - If last_active_date is yesterday: increment streak.
      - If last_active_date is today: no change (already logged in today).
    """
    today = date.today()
    last_active = user.last_active_date  # type: ignore[attr-defined]

    if last_active is None:
        user.streak_days = 1  # type: ignore[attr-defined]
    elif last_active == today:
        return  # Already counted today
    elif last_active == today - timedelta(days=1):
        user.streak_days += 1  # type: ignore[attr-defined]
        # Milestone bonus every N days
        if user.streak_days % settings.streak_bonus_days_threshold == 0:  # type: ignore[attr-defined]
            await award_coins(user, settings.streak_bonus_coins, db)
    else:
        # Streak broken
        user.streak_days = 1  # type: ignore[attr-defined]

    user.last_active_date = today  # type: ignore[attr-defined]


def compute_daily_quests(
    lessons_completed_today: int,
    exams_taken_today: int,
    current_streak: int,
) -> list[dict]:
    """
    Build the list of daily quests with completion status.

    Returns a list of quest dicts for the frontend DailyQuest widget.
    """
    return [
        {
            "id": "complete_lesson",
            "title": "1 ta darsni tugatish",
            "title_ru": "Завершить 1 урок",
            "xp_reward": 25,
            "coin_reward": 0,
            "is_completed": lessons_completed_today >= 1,
            "progress": min(lessons_completed_today, 1),
            "required": 1,
        },
        {
            "id": "take_exam",
            "title": "1 ta imtihon topshirish",
            "title_ru": "Сдать 1 экзамен",
            "xp_reward": 50,
            "coin_reward": 5,
            "is_completed": exams_taken_today >= 1,
            "progress": min(exams_taken_today, 1),
            "required": 1,
        },
        {
            "id": "streak_3",
            "title": "3 kunlik faollik saqlash",
            "title_ru": "Сохранить активность 3 дня",
            "xp_reward": 0,
            "coin_reward": settings.streak_bonus_coins,
            "is_completed": current_streak >= settings.streak_bonus_days_threshold,
            "progress": min(current_streak, settings.streak_bonus_days_threshold),
            "required": settings.streak_bonus_days_threshold,
        },
    ]
