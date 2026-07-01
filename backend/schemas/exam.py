from datetime import datetime
from pydantic import BaseModel, field_validator
from models.question import Subject


class ExamQuestionOut(BaseModel):
    id: int
    subject: Subject
    difficulty: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    is_competency_based: bool
    tags: list[str] | None
    era_tag: str | None

    model_config = {"from_attributes": True}


class ExamStartResponse(BaseModel):
    session_id: int
    questions: list[ExamQuestionOut]
    time_limit_minutes: int
    started_at: datetime
    total_questions: int
    subjects_included: list[Subject]


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: str | None  # None = skipped

    @field_validator("selected_option")
    @classmethod
    def validate_option(cls, v: str | None) -> str | None:
        if v is not None and v.upper() not in ("A", "B", "C", "D"):
            raise ValueError("selected_option must be A, B, C, or D.")
        return v.upper() if v else None


class ExamSubmitRequest(BaseModel):
    session_id: int
    answers: list[AnswerSubmit]


class SubjectBreakdown(BaseModel):
    subject: Subject
    subject_label: str         # Human-readable Uzbek label
    correct_count: int
    total_questions: int
    score: float               # correct_count * 1.1
    max_score: float           # total_questions * 1.1
    percentage: float          # score / max_score * 100


class ExamResultResponse(BaseModel):
    session_id: int
    status: str
    started_at: datetime
    submitted_at: datetime | None
    total_score: float
    max_possible_score: float   # 33.0
    percentage: float
    grade_label: str            # "A'lo", "Yaxshi", "Qoniqarli", "Qoniqarsiz"
    mother_tongue_breakdown: SubjectBreakdown
    math_breakdown: SubjectBreakdown
    history_breakdown: SubjectBreakdown
    total_correct: int
    total_questions: int
    xp_earned: int
    coins_earned: int


class ExamReviewItem(BaseModel):
    question_id: int
    subject: Subject
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    selected_option: str | None
    is_correct: bool
    points_earned: float
    explanation: str
    tags: list[str] | None
    era_tag: str | None


class ExamReviewResponse(BaseModel):
    session_id: int
    items: list[ExamReviewItem]
