"""LLM provider factory — selection from settings (ARCHITECTURE.md §15.2)."""

from __future__ import annotations

from functools import lru_cache

from app.ai.base import BaseLLMProvider
from app.core.config import settings


@lru_cache
def get_llm_provider() -> BaseLLMProvider:
    """Build the configured LLM provider (openai | gemini | local)."""
    provider = settings.LLM_PROVIDER
    if provider == "local":
        from app.ai.local_provider import LocalProvider

        return LocalProvider()
    if provider == "openai":
        from app.ai.openai_provider import OpenAIProvider

        if not settings.LLM_API_KEY:
            # Fail safe for offline demos: never crash the app at import; the
            # AI service will catch and fall back. But at factory time with a
            # configured openai provider we still return it.
            pass
        return OpenAIProvider()
    if provider == "gemini":
        from app.ai.gemini_provider import GeminiProvider

        return GeminiProvider()
    raise RuntimeError(f"Unknown LLM_PROVIDER: {provider}")