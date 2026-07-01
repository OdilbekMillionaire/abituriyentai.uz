from datetime import datetime, date
from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be between 3 and 50 characters.")
        if not v.replace("_", "").isalnum():
            raise ValueError("Username must contain only letters, numbers, and underscores.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    xp: int
    level: int
    streak_days: int
    coins: int
    oxforder_tanga: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    xp: int
    level: int
    streak_days: int
    coins: int
    oxforder_tanga: int = 0
    last_active_date: date | None
    created_at: datetime

    # Computed helpers
    xp_to_next_level: int
    xp_in_current_level: int

    model_config = {"from_attributes": True}


class FirebaseAuthRequest(BaseModel):
    id_token: str
    display_name: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: int | None = None
    username: str | None = None
