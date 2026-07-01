from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=["../.env", ".env"],   # look in project root first, then local
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = (
        "postgresql+asyncpg://abituriyent:abituriyent_secret@localhost:5432/abituriyent_db"
    )
    database_sync_url: str = (
        "postgresql+psycopg2://abituriyent:abituriyent_secret@localhost:5432/abituriyent_db"
    )

    # ── Auth ──────────────────────────────────────────────────────────────────
    secret_key: str = "changeme_in_production_use_openssl_rand_hex_32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours — prevents mid-session logouts

    # ── App ───────────────────────────────────────────────────────────────────
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"
    app_name: str = "AbituriyentAI"
    app_version: str = "0.1.0"

    # ── Firebase ──────────────────────────────────────────────────────────────
    firebase_project_id: str = "abituriyentai-157b2"

    # ── AI — Google Gemini ────────────────────────────────────────────────────
    gemini_api_key: str = ""

    # Model routing (override per-deploy if needed)
    gemini_tutor_model: str = "gemini-2.5-flash"        # AI Tutor chat
    gemini_appeals_model: str = "gemini-2.5-pro"        # Appeals / deep explanations
    gemini_hint_model: str = "gemini-2.5-flash-lite"    # Real-time exam hints (unlimited RPD, 4K RPM)
    gemini_embedding_model: str = "gemini-embedding-002"  # RAG embeddings, unlimited RPD
    imagen_model: str = "imagen-4.0-fast-generate-001"  # Canvas image generation, 70 RPD

    # ── Gamification constants ─────────────────────────────────────────────────
    lesson_xp_reward: int = 50
    exam_completion_xp: int = 100
    streak_bonus_coins: int = 10          # coins at 3-day streak milestone
    streak_bonus_days_threshold: int = 3
    xp_per_level: int = 500              # level = floor(xp / 500) + 1

    # ── Exam constants ─────────────────────────────────────────────────────────
    exam_time_limit_minutes: int = 60
    questions_per_subject: int = 10
    points_per_correct: float = 1.1

    @model_validator(mode="after")
    def validate_critical_vars(self) -> "Settings":
        if self.environment == "production":
            if not self.gemini_api_key:
                raise ValueError("GEMINI_API_KEY muhit o'zgaruvchisi o'rnatilmagan!")
            if self.secret_key == "changeme_in_production_use_openssl_rand_hex_32":
                raise ValueError("SECRET_KEY xavfsiz qiymatga o'zgartirilishi kerak!")
            if not self.database_url or "localhost" in self.database_url:
                raise ValueError("DATABASE_URL muhit o'zgaruvchisi to'g'ri o'rnatilmagan!")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def max_exam_score(self) -> float:
        return self.questions_per_subject * 3 * self.points_per_correct  # 33.0


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
