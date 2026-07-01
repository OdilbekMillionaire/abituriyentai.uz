"""
Scoring service for AbituriyentAI exam sessions.

DTM/UzBMB 2026 scoring standard:
  - Each correct answer = 1.1 points
  - No negative marking for wrong answers
  - Total 30 questions (10 per subject) → max 33.0 points
  - Subject breakdown: Ona tili, Matematika, O'zbekiston tarixi
"""
from __future__ import annotations
from dataclasses import dataclass, field
from models.question import Subject

POINTS_PER_CORRECT: float = 1.1
QUESTIONS_PER_SUBJECT: int = 10
MAX_SCORE: float = 33.0  # 30 questions * 1.1


@dataclass
class SubjectScore:
    subject: Subject
    correct_count: int = 0
    total_questions: int = 0
    score: float = 0.0

    @property
    def max_score(self) -> float:
        return self.total_questions * POINTS_PER_CORRECT

    @property
    def percentage(self) -> float:
        if self.max_score == 0:
            return 0.0
        return round((self.score / self.max_score) * 100, 1)


@dataclass
class ExamScoreResult:
    total_score: float = 0.0
    mother_tongue_score: float = 0.0
    math_score: float = 0.0
    history_score: float = 0.0
    total_correct: int = 0
    total_questions: int = 0
    percentage: float = 0.0
    subject_scores: dict[Subject, SubjectScore] = field(default_factory=dict)


def compute_exam_score(
    answers: list,
    questions_by_id: dict[int, object],
) -> dict:
    """
    Compute exam scores from a list of ExamAnswer objects.

    Args:
        answers: List of ExamAnswer model instances (or any object with
                 question_id, is_correct, points_earned attributes).
        questions_by_id: Dict mapping question_id -> Question model instance.

    Returns:
        Dict with keys: total_score, mother_tongue_score, math_score,
        history_score, total_correct, total_questions, percentage.
    """
    subject_scores: dict[Subject, SubjectScore] = {
        Subject.MOTHER_TONGUE: SubjectScore(subject=Subject.MOTHER_TONGUE),
        Subject.MATHEMATICS:   SubjectScore(subject=Subject.MATHEMATICS),
        Subject.HISTORY:       SubjectScore(subject=Subject.HISTORY),
    }

    for answer in answers:
        question = questions_by_id.get(answer.question_id)
        if question is None:
            continue

        subj: Subject = question.subject
        ss = subject_scores[subj]
        ss.total_questions += 1

        if answer.is_correct:
            ss.correct_count += 1
            ss.score += POINTS_PER_CORRECT

    total_score = sum(ss.score for ss in subject_scores.values())
    total_correct = sum(ss.correct_count for ss in subject_scores.values())
    total_questions = sum(ss.total_questions for ss in subject_scores.values())
    percentage = round((total_score / MAX_SCORE) * 100, 1) if MAX_SCORE else 0.0

    return {
        "total_score":         round(total_score, 2),
        "mother_tongue_score": round(subject_scores[Subject.MOTHER_TONGUE].score, 2),
        "math_score":          round(subject_scores[Subject.MATHEMATICS].score, 2),
        "history_score":       round(subject_scores[Subject.HISTORY].score, 2),
        "total_correct":       total_correct,
        "total_questions":     total_questions,
        "percentage":          percentage,
        "subject_scores":      subject_scores,
    }


def get_grade_label(percentage: float) -> str:
    """Return Uzbek grade label based on percentage score."""
    if percentage >= 90:
        return "A'lo"
    elif percentage >= 75:
        return "Yaxshi"
    elif percentage >= 55:
        return "Qoniqarli"
    else:
        return "Qoniqarsiz"


def format_score_display(score: float) -> str:
    """Format score for display: '27.5 / 33.0'."""
    return f"{score:.1f} / {MAX_SCORE:.1f}"


def is_passing_score(total_score: float, threshold: float = 18.15) -> bool:
    """
    Check if the total score meets the university entrance passing threshold.
    Default threshold: 18.15 (55% of 33.0) — equivalent to "Qoniqarli" grade.
    """
    return total_score >= threshold
