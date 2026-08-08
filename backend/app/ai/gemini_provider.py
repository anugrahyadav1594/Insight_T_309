"""Google Gemini LLM provider (optional; verified at implementation time).

Uses the Gemini generateContent REST API through httpx. If the endpoint shape
changes, only this file changes.
"""

from __future__ import annotations

import httpx

from app.ai.base import BaseLLMProvider, LLMResponse
from app.core.config import settings


class GeminiProvider(BaseLLMProvider):
    """Provider backed by Google's Gemini generateContent API."""

    name = "gemini"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or settings.LLM_API_KEY
        self.model = model or settings.LLM_GEMINI_MODEL

    async def generate(
        self,
        messages: list[dict[str, str]],
        *,
        json_mode: bool = False,
        temperature: float | None = None,
    ) -> LLMResponse:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )
        # Convert OpenAI-style messages to Gemini contents.
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages
        ]
        body: dict = {"contents": contents}
        if temperature is not None:
            body["generationConfig"] = {"temperature": temperature}
        if json_mode:
            body["generationConfig"] = {**(body.get("generationConfig") or {}),
                                        "responseMimeType": "application/json"}

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError):
            text = ""
        return LLMResponse(content=text, model=self.model, raw=data)

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        try:
            await self.generate([{"role": "user", "content": "ping"}], json_mode=False, temperature=0.0)
            return True
        except Exception:
            return False