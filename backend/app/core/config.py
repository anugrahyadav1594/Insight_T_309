"""Application configuration.

All configuration is loaded from environment variables (and ``.env``) through
pydantic-settings. Secrets stay in ``.env`` (gitignored) and are never hardcoded.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# pylint: disable=no-self-argument,no-self-use


class Settings(BaseSettings):
    """Typed application settings (pydantic-settings v2)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- App -----------------------------------------------------------------
    APP_NAME: str = "INSIGHT"
    ENVIRONMENT: Literal["development", "staging", "production", "test"] = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # --- Ports ----------------------------------------------------------------
    API_PORT: int = 9056
    FRONTEND_PORT: int = 5513

    # --- Database -------------------------------------------------------------
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/insight"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "insight"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # --- Redis ----------------------------------------------------------------
    REDIS_URL: str = "redis://redis:6379/0"

    # --- Auth -----------------------------------------------------------------
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Market data (FMP) -----------------------------------------------------
    FMP_API_KEY: str = ""
    FMP_BASE_URL: str = "https://financialmodelingprep.com"
    FMP_TIMEOUT_SECONDS: float = 10.0
    FMP_MAX_RETRIES: int = 2
    MARKET_DATA_PROVIDER: Literal["fmp", "mock", "yahoo"] = "fmp"
    # FMP plan-dependent features: "mock" disables the "no key at startup" hard fail.
    REQUIRE_FMP_KEY: bool = True

    # --- LLM ------------------------------------------------------------------
    LLM_PROVIDER: Literal["openai", "gemini", "local"] = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_GEMINI_MODEL: str = "gemini-1.5-flash"
    LLM_TIMEOUT_SECONDS: float = 30.0
    LLM_TEMPERATURE: float = 0.2

    # --- CORS -----------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:5513,http://127.0.0.1:5513"

    # --- Rate limiting (slowapi + Redis) ---------------------------------------
    RATE_LIMIT_DEFAULT_PER_MINUTE: int = 120
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10
    RATE_LIMIT_AI_PER_MINUTE: int = 20
    RATE_LIMIT_ENABLED: bool = True

    # --- Caching TTLs (seconds) -------------------------------------------------
    CACHE_TTL_PROFILE: int = 86400          # 24 h
    CACHE_TTL_QUOTE: int = 300              # 5 min
    CACHE_TTL_METRICS: int = 1800           # 30 min
    CACHE_TTL_STATEMENTS: int = 86400       # 24 h
    CACHE_TTL_HISTORY: int = 86400          # 24 h
    CACHE_TTL_ANALYSIS: int = 1800          # 30 min
    CACHE_TTL_SEARCH: int = 600             # 10 min
    CACHE_TTL_DASHBOARD: int = 300          # 5 min
    CACHE_TTL_SCREENER: int = 900           # 15 min
    CACHE_TTL_PORTFOLIO_ANALYSIS: int = 600  # 10 min

    # --- Data freshness rules ----------------------------------------------------
    QUOTE_STALE_AFTER_SECONDS: int = 900          # 15 min
    PROFILE_STALE_AFTER_SECONDS: int = 86400      # 24 h

    # --- Misc ---------------------------------------------------------------------
    REQUEST_ID_HEADER: str = "X-Request-ID"

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def _validate_jwt_secret(cls, v: str, info) -> str:
        # Fail fast in production when the secret is missing.
        env = info.data.get("ENVIRONMENT")
        if not v and env == "production":
            raise ValueError("JWT_SECRET_KEY is required and must be a strong secret")
        return v

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _split_origins(cls, v: str) -> list[str]:
        return [o.strip() for o in v.split(",") if o.strip()]

    @property
    def cors_origins(self) -> list[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return self.CORS_ORIGINS

    @property
    def access_token_ttl_seconds(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    @property
    def refresh_token_ttl_seconds(self) -> int:
        return self.REFRESH_TOKEN_EXPIRE_DAYS * 86400


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()