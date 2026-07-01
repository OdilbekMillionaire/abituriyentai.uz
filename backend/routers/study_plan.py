"""
Personalized study plan generator.

Rule-based algorithm:
  1. Pull weak areas (accuracy < 0.6) for this user
  2. Count days remaining until exam date
  3. Allocate days: weak topics get 2 days, others 1 day
  4. Build a day-by-day schedule with recommended action type per day
"""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from routers.auth import get_current_user
from services.ai_service import generate_study_advice

router = APIRouter()

# Human-readable labels (same as frontend TAG_LABELS)
TAG_LABELS: dict[str, str] = {
    "ARITHMETIC":        "Arifmetika",
    "PERCENTAGE":        "Foiz masalalari",
    "ALGEBRA":           "Algebra",
    "GEOMETRY":          "Geometriya",
    "WORD_PROBLEM":      "Amaliy masalalar",
    "UNIT_CONVERSION":   "Birliklar o'tkazish",
    "STATISTICS":        "Statistika",
    "LOGIC":             "Mantiq",
    "SPELLING":          "Imlo qoidalari",
    "PUNCTUATION":       "Tinish belgilari",
    "GRAMMAR":           "Grammatika",
    "LEXICOLOGY":        "Leksikologiya",
    "FIGURATIVE_LANGUAGE": "Ko'chma ma'no",
    "LITERATURE":        "Adabiyot",
    "CLASSIC":           "Klassik adabiyot",
    "NAVOI":             "Alisher Navoiy",
    "ERA_ANCIENT":       "Qadim davrlar",
    "ERA_MEDIEVAL":      "O'rta asrlar",
    "ERA_COLONIAL":      "Mustamlaka davri",
    "ERA_SOVIET":        "Sovet davri",
    "ERA_INDEPENDENCE":  "Mustaqillik davri",
    "ERA_NEW_UZBEKISTAN":"Yangi O'zbekiston",
}

SUBJECT_LABELS = {
    "MOTHER_TONGUE": "Ona tili",
    "MATHEMATICS":   "Matematika",
    "HISTORY":       "Tarix",
}

ACTION_CYCLE = ["lesson", "drill", "mini_exam", "drill", "review"]
ACTION_LABELS = {
    "lesson":    {"uz": "Dars o'rganish",       "icon": "📖", "href_tpl": "/learn?subject={subject_lc}"},
    "drill":     {"uz": "Drill mashqi",          "icon": "⚡", "href_tpl": "/drill?subject={subject_lc}"},
    "mini_exam": {"uz": "Mini imtihon",          "icon": "✍️", "href_tpl": "/exam?subject={subject_lc}"},
    "review":    {"uz": "Takrorlash",            "icon": "🔁", "href_tpl": "/drill?subject={subject_lc}"},
}


class PlanDay(BaseModel):
    day_number: int
    date_str: str          # YYYY-MM-DD
    is_today: bool
    is_past: bool
    topic_label: str
    subject: str
    subject_label: str
    action_type: str
    action_label: str
    action_icon: str
    action_href: str
    accuracy: float | None  # known accuracy for this topic, or None
    is_weak: bool


class StudyPlanResponse(BaseModel):
    days_remaining: int
    exam_date: str
    plan: list[PlanDay]
    total_weak_topics: int
    total_topics: int
    message: str


class AiAdviceResponse(BaseModel):
    daily_focus: str
    weekly_plan: list[str]
    motivational_message: str
    priority_topics: list[str]
    study_technique: str


@router.get("", response_model=StudyPlanResponse, summary="Shaxsiy o'quv rejasi")
async def get_study_plan(
    exam_date: str = Query(description="BMBA sanasi (YYYY-MM-DD formatida)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StudyPlanResponse:
    # Validate exam date
    try:
        exam_dt = date.fromisoformat(exam_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="exam_date formati noto'g'ri. YYYY-MM-DD bo'lishi kerak.")

    today = date.today()
    days_remaining = (exam_dt - today).days
    if days_remaining < 0:
        raise HTTPException(status_code=400, detail="Imtihon sanasi o'tib ketgan.")
    if days_remaining == 0:
        days_remaining = 1  # at least show today

    # ── Pull weak area data ────────────────────────────────────────────────────
    rows = await db.execute(
        text("""
            SELECT q.tags, q.subject, ea.is_correct
            FROM exam_answers ea
            JOIN exam_sessions es ON ea.session_id = es.id
            JOIN questions q ON ea.question_id = q.id
            WHERE es.user_id = :uid AND es.status = 'SUBMITTED'
              AND q.tags IS NOT NULL AND q.tags::text != 'null'
        """),
        {"uid": current_user.id},
    )
    answer_rows = rows.fetchall()

    import json as _json
    tag_stats: dict[str, dict] = {}
    for tags_raw, subject, is_correct in answer_rows:
        tags = _json.loads(tags_raw) if isinstance(tags_raw, str) else (tags_raw or [])
        for tag in tags:
            key = f"{subject}::{tag}"
            if key not in tag_stats:
                tag_stats[key] = {"subject": subject, "tag": tag, "correct": 0, "total": 0}
            tag_stats[key]["total"] += 1
            if is_correct:
                tag_stats[key]["correct"] += 1

    # Build topic list with accuracy
    known_topics: list[dict] = []
    for k, v in tag_stats.items():
        if v["total"] == 0:
            continue
        accuracy = v["correct"] / v["total"]
        known_topics.append({
            "key": k, "subject": v["subject"], "tag": v["tag"],
            "accuracy": accuracy, "is_weak": accuracy < 0.6,
        })

    # If no exam history, fall back to all standard topics
    if not known_topics:
        default_topics: list[dict] = []
        for subj, tags in [
            ("MOTHER_TONGUE", ["GRAMMAR","SPELLING","PUNCTUATION","LEXICOLOGY","LITERATURE","FIGURATIVE_LANGUAGE"]),
            ("MATHEMATICS",   ["ARITHMETIC","ALGEBRA","GEOMETRY","PERCENTAGE","WORD_PROBLEM","LOGIC"]),
            ("HISTORY",       ["ERA_ANCIENT","ERA_MEDIEVAL","ERA_COLONIAL","ERA_SOVIET","ERA_INDEPENDENCE","ERA_NEW_UZBEKISTAN"]),
        ]:
            for tag in tags:
                default_topics.append({"key": f"{subj}::{tag}", "subject": subj, "tag": tag, "accuracy": None, "is_weak": False})
        known_topics = default_topics

    # Sort: weak first, then by accuracy ascending
    known_topics.sort(key=lambda t: (not t["is_weak"], t["accuracy"] if t["accuracy"] is not None else 0.5))

    # ── Build schedule ─────────────────────────────────────────────────────────
    # Expand: weak topics repeat twice
    expanded: list[dict] = []
    for t in known_topics:
        expanded.append(t)
        if t["is_weak"]:
            expanded.append({**t, "_repeat": True})

    # Cycle through topics across available days
    plan: list[PlanDay] = []
    limit = min(days_remaining, 60)  # show max 60 days ahead

    for day_idx in range(limit):
        current_date = today + timedelta(days=day_idx)
        topic = expanded[day_idx % len(expanded)] if expanded else {
            "subject": "MATHEMATICS", "tag": "ARITHMETIC", "accuracy": None, "is_weak": False
        }

        action_type = ACTION_CYCLE[day_idx % len(ACTION_CYCLE)]
        action_info = ACTION_LABELS[action_type]
        subject_lc = topic["subject"].lower()
        href = action_info["href_tpl"].format(subject_lc=subject_lc)

        plan.append(PlanDay(
            day_number=day_idx + 1,
            date_str=current_date.isoformat(),
            is_today=(current_date == today),
            is_past=(current_date < today),
            topic_label=TAG_LABELS.get(topic["tag"], topic["tag"]),
            subject=topic["subject"],
            subject_label=SUBJECT_LABELS.get(topic["subject"], topic["subject"]),
            action_type=action_type,
            action_label=action_info["uz"],
            action_icon=action_info["icon"],
            action_href=href,
            accuracy=round(topic["accuracy"], 2) if topic["accuracy"] is not None else None,
            is_weak=topic["is_weak"],
        ))

    weak_count = sum(1 for t in known_topics if t["is_weak"])

    if weak_count == 0 and not answer_rows:
        message = "Imtihon topshirib, zaif mavzularingizni aniqlang — reja yanada aniqroq bo'ladi."
    elif weak_count == 0:
        message = f"Ajoyib! Zaif mavzu yo'q. {days_remaining} kun qoldi — takrorlashni davom eting."
    else:
        message = f"{weak_count} ta zaif mavzu topildi. Ular rejada ustunlik bilan joylashtirildi."

    return StudyPlanResponse(
        days_remaining=days_remaining,
        exam_date=exam_date,
        plan=plan,
        total_weak_topics=weak_count,
        total_topics=len(known_topics),
        message=message,
    )


@router.get("/ai-advice", response_model=AiAdviceResponse, summary="AI shaxsiy o'quv maslahati")
async def get_ai_advice(
    exam_date: str = Query(description="BMBA sanasi (YYYY-MM-DD formatida)"),
    language: str = Query(default="uz"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AiAdviceResponse:
    try:
        exam_dt = date.fromisoformat(exam_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="exam_date formati noto'g'ri. YYYY-MM-DD bo'lishi kerak.")

    today = date.today()
    days_remaining = max(1, (exam_dt - today).days)

    rows = await db.execute(
        text("""
            SELECT q.tags, q.subject, ea.is_correct
            FROM exam_answers ea
            JOIN exam_sessions es ON ea.session_id = es.id
            JOIN questions q ON ea.question_id = q.id
            WHERE es.user_id = :uid AND es.status = 'SUBMITTED'
              AND q.tags IS NOT NULL AND q.tags::text != 'null'
        """),
        {"uid": current_user.id},
    )
    answer_rows = rows.fetchall()

    import json as _json
    tag_stats: dict[str, dict] = {}
    for tags_raw, subject, is_correct in answer_rows:
        tags = _json.loads(tags_raw) if isinstance(tags_raw, str) else (tags_raw or [])
        for tag in tags:
            key = f"{subject}::{tag}"
            if key not in tag_stats:
                tag_stats[key] = {"subject": subject, "tag": tag, "correct": 0, "total": 0}
            tag_stats[key]["total"] += 1
            if is_correct:
                tag_stats[key]["correct"] += 1

    weak_topics = []
    for v in tag_stats.values():
        if v["total"] == 0:
            continue
        accuracy = v["correct"] / v["total"]
        if accuracy < 0.6:
            weak_topics.append({
                "subject": v["subject"],
                "subject_label": SUBJECT_LABELS.get(v["subject"], v["subject"]),
                "tag": v["tag"],
                "tag_label": TAG_LABELS.get(v["tag"], v["tag"]),
                "accuracy": accuracy,
            })
    weak_topics.sort(key=lambda t: t["accuracy"])

    try:
        advice = await generate_study_advice(
            weak_topics=weak_topics,
            days_remaining=days_remaining,
            exam_date=exam_date,
            language=language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return AiAdviceResponse(**advice)
