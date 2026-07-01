"""
Bookmarks — save questions for later review.

Endpoints:
  POST /bookmarks/{question_id}   — toggle bookmark (add if missing, remove if exists)
  GET  /bookmarks                 — list all bookmarked questions
  GET  /bookmarks/ids             — list bookmarked question IDs (for UI state)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.bookmark import Bookmark
from models.question import Question, Subject
from models.user import User
from routers.auth import get_current_user

router = APIRouter()


class BookmarkToggleResponse(BaseModel):
    question_id: int
    bookmarked: bool


class BookmarkedQuestion(BaseModel):
    question_id: int
    subject: Subject
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str
    tags: list[str] | None
    era_tag: str | None


class BookmarkListResponse(BaseModel):
    questions: list[BookmarkedQuestion]
    total: int


@router.post("/{question_id}", response_model=BookmarkToggleResponse, summary="Savolni saqlash/o'chirish")
async def toggle_bookmark(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookmarkToggleResponse:
    # Check question exists
    q_res = await db.execute(select(Question).where(Question.id == question_id))
    if not q_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Savol topilmadi.")

    bm_res = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == current_user.id,
            Bookmark.question_id == question_id,
        )
    )
    existing = bm_res.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.flush()
        return BookmarkToggleResponse(question_id=question_id, bookmarked=False)
    else:
        db.add(Bookmark(user_id=current_user.id, question_id=question_id))
        await db.flush()
        return BookmarkToggleResponse(question_id=question_id, bookmarked=True)


@router.get("", response_model=BookmarkListResponse, summary="Saqlangan savollar ro'yxati")
async def list_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookmarkListResponse:
    result = await db.execute(
        select(Bookmark)
        .options(selectinload(Bookmark.question))
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    )
    bookmarks = result.scalars().all()

    questions = [
        BookmarkedQuestion(
            question_id=bm.question.id,
            subject=bm.question.subject,
            question_text=bm.question.question_text,
            option_a=bm.question.option_a,
            option_b=bm.question.option_b,
            option_c=bm.question.option_c,
            option_d=bm.question.option_d,
            correct_option=bm.question.correct_option,
            explanation=bm.question.explanation or "",
            tags=bm.question.tags,
            era_tag=bm.question.era_tag,
        )
        for bm in bookmarks
    ]

    return BookmarkListResponse(questions=questions, total=len(questions))


@router.get("/ids", response_model=list[int], summary="Saqlangan savol IDlari")
async def bookmark_ids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[int]:
    result = await db.execute(
        select(Bookmark.question_id).where(Bookmark.user_id == current_user.id)
    )
    return [row[0] for row in result.fetchall()]
