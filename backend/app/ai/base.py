"""Provider-agnostic LLM interface (ARCHITECTURE.md §15).

The AI service depends only on this interface. OpenAI, Gemini, Local
(deterministic template fallback) and a test Mock provider implement it.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, ConfigDict


class LLMResponse(BaseModel):
    """A provider response (content is raw text; may be JSON for structured calls)."""

    content: str
    model: str
    raw: dict[str, Any] | None = None

    model_config = ConfigDict(extra="ignore")


class BaseLLMProvider(ABC):
    """Abstract LLM provider."""

    name: str = "base"
    model: str = ""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict[str, str]],
        *,
        json_mode: bool = False,
        temperature: float | None = None,
    ) -> LLMResponse:
        """Generate a completion from ``messages`` (OpenAI-style role/content pairs)."""

    @abstractmethod
    async def health_check(self) -> bool:
        """Return whether the provider is reachable."""
