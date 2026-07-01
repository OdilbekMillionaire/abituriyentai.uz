from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


# Strip sslmode/channel_binding params from URL — asyncpg uses connect_args instead
import re as _re
_async_url = _re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', settings.database_url)
_async_url = _async_url.rstrip('?&')

engine = create_async_engine(
    _async_url,
    echo=settings.environment == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "ssl": "require",          # Neon/Supabase require SSL; asyncpg uses this form
        "statement_cache_size": 0,  # Supabase transaction pooler (pgBouncer) is incompatible
                                    # with asyncpg prepared-statement caching — disable it.
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:  # type: ignore[return]
    """FastAPI dependency that yields a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables and enable pgvector extension."""
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Import models so Base has them registered
        import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        # Migrate existing users table: add firebase_uid, make hashed_password nullable
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE"
        ))
        await conn.execute(text(
            "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' NOT NULL"
        ))
