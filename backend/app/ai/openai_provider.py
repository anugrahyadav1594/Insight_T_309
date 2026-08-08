"""OpenAI LLM provider (default for the hackathon)."""

from __future__ import annotations

import logging
from typing import Any

from app.ai.base import BaseLLMProvider, LLMResponse
from app.core.config import settings

logger = logging.getLogger("insight.ai")


class OpenAIProvider(BaseLLMProvider):
    """Provider backed by the OpenAI chat-completions API."""

    name = "openai"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or settings.LLM_API_KEY
        self.model = model or settings.LLM_MODEL

    async def generate(
        self,
        messages: list[dict[str, str]],
        *,
        json_mode: bool = False,
        temperature: float | None = None,
    ) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self.api_key, timeout=settings.LLM_TIMEOUT_SECONDS)
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature if temperature is not None else settings.LLM_TEMPERATURE,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        completion = await client.chat.completions.create(**kwargs)
        content = completion.choices[0].message.content or ""
        raw = completion.model_dump() if hasattr(completion, "model_dump") else None
        return LLMResponse(content=content, model=self.model, raw=raw)

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        try:
            await self.generate(
                [{"role": "user", "content": "ping"}],
                json_mode=False,
                temperature=0.0,
            )
            return True
        except Exception:
            return False