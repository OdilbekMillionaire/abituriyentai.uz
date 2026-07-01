from datetime import datetime
from pydantic import BaseModel
from models.question import Subject


class LessonListItem(BaseModel):
    id: int
    subject: Subject
    title: str
    order_index: int
    xp_reward: int
    era_tag: str | None
    created_at: datetime
    is_completed: bool = False   # populated from UserProgress join

    model_config = {"from_attributes": True}


class LessonOut(BaseModel):
    id: int
    subject: Subject
    title: str
    content_markdown: str
    order_index: int
    xp_reward: int
    era_tag: str | None
    created_at: datetime
    is_completed: bool = False

    model_config = {"from_attributes": True}


class LessonCompleteResponse(BaseModel):
    lesson_id: int
    xp_earned: int
    new_total_xp: int
    new_level: int
    coins_earned: int
    message: str
