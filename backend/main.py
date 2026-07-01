import logging
import logging.config
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from config import settings
from database import init_db, get_db
from routers import auth, exams, lessons, gamification, appeals
from routers import ai_tutor, ai_lessons, drill, bookmarks, study_plan, canvas, games, parent


# ── Logging ───────────────────────────────────────────────────────────────────

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s %(levelname)s %(name)s — %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {"level": "INFO", "handlers": ["console"]},
    "loggers": {
        "uvicorn": {"level": "INFO"},
        "sqlalchemy.engine": {"level": "WARNING"},
    },
})

logger = logging.getLogger(__name__)


# ── Rate limiter ──────────────────────────────────────────────────────────────

def _get_user_or_ip(request: Request) -> str:
    """Use JWT user_id as rate-limit key if available, otherwise use IP."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            from jose import jwt as _jwt
            payload = _jwt.decode(
                token, settings.secret_key,
                algorithms=[settings.algorithm],
                options={"verify_exp": False},
            )
            uid = payload.get("sub")
            if uid:
                return f"user:{uid}"
        except Exception:
            pass
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_or_ip)


# ── Middleware ────────────────────────────────────────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health":
            return await call_next(request)
        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000
        logger.info(
            "%s %s → %s (%.0fms)",
            request.method, request.url.path, response.status_code, duration_ms,
        )
        return response


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("AbituriyentAI backend started — %s", settings.environment)
    yield


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AbituriyentAI — O'zbekiston abituriyentlari uchun AI-powered tayyorgarlik platformasi. "
        "BMBA 2026 standartlari asosida."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/auth",         tags=["Authentication"])
app.include_router(exams.router,        prefix="/exams",        tags=["Exams"])
app.include_router(lessons.router,      prefix="/lessons",      tags=["Lessons"])
app.include_router(gamification.router, prefix="/user",         tags=["Gamification"])
app.include_router(appeals.router,      prefix="/appeals",      tags=["Appeals"])
app.include_router(ai_tutor.router,     prefix="/ai",           tags=["AI Tutor (Gemini)"])
app.include_router(ai_lessons.router,  prefix="/ai-lessons",   tags=["AI Lesson Generator"])
app.include_router(drill.router,       prefix="/drill",         tags=["Spaced Repetition Drill"])
app.include_router(bookmarks.router,   prefix="/bookmarks",     tags=["Bookmarks"])
app.include_router(study_plan.router,  prefix="/study-plan",    tags=["Study Plan"])
app.include_router(canvas.router,      prefix="/canvas",         tags=["Abituriyent Canvas"])
app.include_router(games.router,       prefix="/games",          tags=["Educational Games"])
app.include_router(parent.router,      prefix="/parent",         tags=["Parent / Teacher Access"])


# ── Global exception handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method, request.url.path, exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Ichki server xatoligi yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."},
    )


# ── Health & root ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root() -> JSONResponse:
    return JSONResponse(
        {
            "app": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "message": "AbituriyentAI API — Universitetga kirish imtihoniga tayyorlaning!",
        }
    )


@app.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    db_status = "unknown"
    try:
        async for session in get_db():
            await session.execute(text("SELECT 1"))
            db_status = "ok"
            break
    except Exception:
        db_status = "error"

    return JSONResponse(
        {
            "status": "ok" if db_status == "ok" else "degraded",
            "db": db_status,
            "version": settings.app_version,
            "environment": settings.environment,
        }
    )
