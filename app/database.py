from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import MetaData, text
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp for Python-side defaults."""

    return datetime.now(UTC)


class Base(AsyncAttrs, DeclarativeBase):
    """Shared SQLAlchemy 2.0 declarative base."""

    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


settings = get_settings()
engine = create_async_engine(settings.database_url, pool_pre_ping=True, echo=settings.debug)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session for request-scoped dependency injection."""

    async with AsyncSessionLocal() as session:
        yield session


async def check_database() -> dict[str, Any]:
    """Run a tiny database health check used by startup and /health."""

    async with engine.connect() as connection:
        result = await connection.execute(text("select 1"))
        return {"database": bool(result.scalar_one())}
