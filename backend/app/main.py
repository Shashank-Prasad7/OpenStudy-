from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging

import redis.asyncio as redis
import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import check_database, engine
from app.routers import ai, auth, goals, matches, rooms, users
from app.tasks.cleanup import start_cleanup_task, stop_cleanup_task
from app.websocket.manager import websocket_router

settings = get_settings()
logger = structlog.get_logger(__name__)


def configure_logging() -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
        cache_logger_on_first_use=True,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    app.state.redis = None
    try:
        client = redis.from_url(settings.redis_url, decode_responses=True)
        await client.ping()
        app.state.redis = client
        logger.info("redis_connected")
    except Exception as exc:
        logger.warning("redis_unavailable", error=str(exc))

    await check_database()
    await start_cleanup_task(app, retention_hours=settings.pomodoro_retention_hours)
    logger.info("startup_complete", app=settings.app_name, environment=settings.environment)
    try:
        yield
    finally:
        await stop_cleanup_task(app)
        if app.state.redis is not None:
            await app.state.redis.aclose()
        await engine.dispose()
        logger.info("shutdown_complete")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Open-source collaborative study rooms, goals, partner matching, and AI planning.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in settings.cors_origins if "*" not in origin],
    allow_origin_regex=r"https://.*\.vercel\.app" if any("*" in origin for origin in settings.cors_origins) else None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warning("validation_error", path=request.url.path, errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": {"message": "Invalid request payload.", "code": "validation_error"}, "errors": exc.errors()},
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("database_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": {"message": "Database operation failed.", "code": "database_error"}},
    )


@app.get("/health", tags=["health"])
async def health(request: Request) -> dict[str, bool]:
    await check_database()
    redis_ok = False
    client = getattr(request.app.state, "redis", None)
    if client is not None:
        try:
            redis_ok = bool(await client.ping())
        except Exception:
            redis_ok = False
    return {"ok": True, "database": True, "redis": redis_ok}


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(rooms.router, prefix=settings.api_prefix)
app.include_router(goals.router, prefix=settings.api_prefix)
app.include_router(matches.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(websocket_router)
