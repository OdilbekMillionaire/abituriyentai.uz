"""
AbituriyentAI — Games Router
Endpoints for all 10 educational games:
  1. Flashcards    GET  /games/flashcards
  2. Kim bo'lmoqchi GET /games/kim-bolmoqchi
  3. Matching       GET  /games/matching
  4. Crossword      POST /games/crossword
  5. Hangman        GET  /games/hangman
  6. True/False     GET  /games/true-false
  7. Fill in Blank  GET  /games/fill-blank
"""

import json as _json
import random
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from routers.auth import get_current_user
from services.ai_service import (
    generate_matching_pairs, generate_crossword_data, generate_hangman_word,
    generate_true_false, generate_fill_blank,
)

router = APIRouter()


# ── Shared models ─────────────────────────────────────────────────────────────

class FlashCard(BaseModel):
    id: int
    subject: str
    question: str
    answer: str          # correct option text
    all_options: list[str]
    correct_index: int
    explanation: str | None
    difficulty: str
    tags: list[str]


class KimQuestion(BaseModel):
    id: int
    question: str
    options: list[str]   # A, B, C, D texts
    correct_index: int
    explanation: str | None
    difficulty: str
    prize_level: int     # 1-15


class MatchingPair(BaseModel):
    id: int
    left: str
    right: str


class MatchingResponse(BaseModel):
    pairs: list[MatchingPair]
    subject: str
    topic: str


class CrosswordClue(BaseModel):
    number: int
    clue: str
    answer: str
    row: int
    col: int
    direction: str   # "across" | "down"
    length: int


class CrosswordResponse(BaseModel):
    grid: list[list[str]]   # 15x15 grid, "#" = black, "" = empty, letter = filled
    clues: list[CrosswordClue]
    subject: str
    topic: str


class HangmanWord(BaseModel):
    word: str
    hint: str
    subject: str
    max_wrong: int


# ── Helper ────────────────────────────────────────────────────────────────────

def _row_to_flashcard(row, prize_level: int | None = None) -> dict:
    opts = [row.option_a, row.option_b, row.option_c, row.option_d]
    correct_idx = {"A": 0, "B": 1, "C": 2, "D": 3}.get(row.correct_option, 0)
    tags = row.tags if isinstance(row.tags, list) else (
        _json.loads(row.tags) if isinstance(row.tags, str) else []
    )
    return {
        "id": row.id,
        "subject": row.subject,
        "question": row.question_text,
        "answer": opts[correct_idx],
        "all_options": opts,
        "correct_index": correct_idx,
        "explanation": row.explanation,
        "difficulty": row.difficulty,
        "tags": tags,
    }


# ── 1. Flashcards ─────────────────────────────────────────────────────────────

@router.get("/flashcards", response_model=list[FlashCard], summary="Flashcard o'yini")
async def get_flashcards(
    subject: str = Query(default="MATHEMATICS"),
    limit: int = Query(default=15, le=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FlashCard]:
    subject = subject.upper()
    rows = await db.execute(
        text("""
            SELECT id, subject, difficulty, question_text,
                   option_a, option_b, option_c, option_d,
                   correct_option, explanation, tags
            FROM questions
            WHERE subject = :subj
            ORDER BY RANDOM()
            LIMIT :lim
        """),
        {"subj": subject, "lim": limit},
    )
    cards = [FlashCard(**_row_to_flashcard(r)) for r in rows.fetchall()]
    if not cards:
        raise HTTPException(status_code=404, detail="Bu fan uchun savollar topilmadi.")
    return cards


# ── 2. Kim bo'lmoqchi ─────────────────────────────────────────────────────────

@router.get("/kim-bolmoqchi", response_model=list[KimQuestion], summary="Kim bo'lmoqchi o'yini")
async def get_kim_questions(
    subject: str = Query(default="MATHEMATICS"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[KimQuestion]:
    subject = subject.upper()
    # 5 easy, 5 medium, 5 hard — prize ladder levels 1-15
    questions: list[KimQuestion] = []
    for diff, count, start_level in [("EASY", 5, 1), ("MEDIUM", 5, 6), ("HARD", 5, 11)]:
        rows = await db.execute(
            text("""
                SELECT id, subject, difficulty, question_text,
                       option_a, option_b, option_c, option_d,
                       correct_option, explanation, tags
                FROM questions
                WHERE subject = :subj AND difficulty = :diff
                ORDER BY RANDOM()
                LIMIT :cnt
            """),
            {"subj": subject, "diff": diff, "cnt": count},
        )
        fetched = rows.fetchall()
        for i, r in enumerate(fetched):
            base = _row_to_flashcard(r)
            questions.append(KimQuestion(
                id=base["id"],
                question=base["question"],
                options=base["all_options"],
                correct_index=base["correct_index"],
                explanation=base["explanation"],
                difficulty=base["difficulty"],
                prize_level=start_level + i,
            ))
    if not questions:
        raise HTTPException(status_code=404, detail="Savollar topilmadi.")
    return questions


# ── 3. Matching Pairs ─────────────────────────────────────────────────────────

@router.get("/matching", response_model=MatchingResponse, summary="Juftlik topish o'yini")
async def get_matching_pairs(
    subject: str = Query(default="HISTORY"),
    topic: str = Query(default=""),
    language: str = Query(default="uz"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MatchingResponse:
    subject = subject.upper()
    # Use AI to generate topic-specific matching pairs
    try:
        pairs_data = await generate_matching_pairs(subject=subject, topic=topic, language=language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    pairs = [MatchingPair(id=i, left=p["left"], right=p["right"])
             for i, p in enumerate(pairs_data["pairs"])]
    return MatchingResponse(pairs=pairs, subject=subject, topic=topic or pairs_data.get("topic", ""))


# ── 4. Crossword ──────────────────────────────────────────────────────────────

class CrosswordRequest(BaseModel):
    subject: str = "HISTORY"
    topic: str = ""
    language: str = "uz"


@router.post("/crossword", response_model=CrosswordResponse, summary="Krossvord o'yini")
async def get_crossword(
    body: CrosswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CrosswordResponse:
    try:
        data = await generate_crossword_data(
            subject=body.subject.upper(),
            topic=body.topic,
            language=body.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    clues = [CrosswordClue(**c) for c in data["clues"]]
    return CrosswordResponse(grid=data["grid"], clues=clues,
                              subject=body.subject.upper(), topic=body.topic)


# ── 5. Hangman ────────────────────────────────────────────────────────────────

@router.get("/hangman", response_model=HangmanWord, summary="Osib o'ldirish o'yini")
async def get_hangman_word(
    subject: str = Query(default="MATHEMATICS"),
    language: str = Query(default="uz"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HangmanWord:
    try:
        data = await generate_hangman_word(subject=subject.upper(), language=language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return HangmanWord(
        word=data["word"].upper(),
        hint=data["hint"],
        subject=subject.upper(),
        max_wrong=6,
    )


# ── 6. True / False Blitz ─────────────────────────────────────────────────────

class TrueFalseItem(BaseModel):
    id: int
    statement: str
    is_true: bool
    explanation: str


class TrueFalseResponse(BaseModel):
    items: list[TrueFalseItem]
    subject: str


@router.get("/true-false", response_model=TrueFalseResponse, summary="Ha/Yo'q Blitz")
async def get_true_false(
    subject: str = Query(default="MATHEMATICS"),
    language: str = Query(default="uz"),
    count: int = Query(default=10, ge=5, le=15),
    current_user: User = Depends(get_current_user),
) -> TrueFalseResponse:
    try:
        data = await generate_true_false(subject=subject.upper(), language=language, count=count)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    items = [TrueFalseItem(**item) for item in data]
    return TrueFalseResponse(items=items, subject=subject.upper())


# ── 7. Fill in the Blank ──────────────────────────────────────────────────────

class FillBlankItem(BaseModel):
    id: int
    sentence: str
    answer: str
    options: list[str]
    explanation: str


class FillBlankResponse(BaseModel):
    items: list[FillBlankItem]
    subject: str


@router.get("/fill-blank", response_model=FillBlankResponse, summary="Bo'sh joy to'ldiring")
async def get_fill_blank(
    subject: str = Query(default="MATHEMATICS"),
    language: str = Query(default="uz"),
    count: int = Query(default=8, ge=5, le=12),
    current_user: User = Depends(get_current_user),
) -> FillBlankResponse:
    try:
        data = await generate_fill_blank(subject=subject.upper(), language=language, count=count)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    items = [FillBlankItem(**item) for item in data]
    return FillBlankResponse(items=items, subject=subject.upper())
