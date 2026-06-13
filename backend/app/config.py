from functools import lru_cache
from typing import Annotated

from pydantic import AnyHttpUrl, BeforeValidator, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_csv(value: str | list[str]) -> list[str]:
    if isinstance(value, list):
        return value
    return [item.strip() for item in value.split(",") if item.strip()]


CorsOrigins = Annotated[list[str], BeforeValidator(_split_csv)]


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env files."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "OpenStudy API"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api"

    database_url: str = "sqlite+aiosqlite:///:memory:"
    alembic_database_url: str | None = None
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: SecretStr = Field(default=SecretStr("change-me"))
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    cookie_secure: bool = False
    cookie_domain: str | None = None

    cors_origins: CorsOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
    ]

    groq_api_key: SecretStr | None = None
    groq_model: str = "llama3-70b-8192"

    auth_rate_limit: int = 8
    auth_rate_limit_window_seconds: int = 60
    log_level: str = "INFO"
    # Hours to retain completed Pomodoro states in Redis before cleanup
    pomodoro_retention_hours: int = 24

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def resolved_alembic_database_url(self) -> str:
        return self.alembic_database_url or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
