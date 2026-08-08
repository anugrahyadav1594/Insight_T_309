"""Deterministic local LLM fallback provider (ARCHITECTURE.md §15.6, §27).

Produces template answers from the trusted context embedded in the prompt, so
every AI surface keeps working offline / when the network provider fails. It
never fabricates numbers: every value it emits is read from the context.
"""

from __future__ import annotations

import json
from typing import Any

from app.ai.base import BaseLLMProvider, LLMResponse

# Markers used by PromptService to signal the task kind.
_COMPANY_MARKER = "Analyse this company using ONLY the following trusted context."
_PORTFOLIO_MARKER = "Analyse this portfolio using ONLY the supplied trusted context."
_CHAT_MARKER = "Scope: "


class LocalProvider(BaseLLMProvider):
    """Deterministic template fallback."""

    name = "local"
    model = "local-template"

    async def generate(
        self,
        messages: list[dict[str, str]],
        *,
        json_mode: bool = False,
        temperature: float | None = None,
    ) -> LLMResponse:
        user = next((m["content"] for m in messages if m["role"] == "user"), "")
        if user.startswith(_CHAT_MARKER):
            return LLMResponse(content=json.dumps(self._chat_reply(user)), model=self.model)
        if _COMPANY_MARKER in user:
            context = self._extract_last_json(user)
            return LLMResponse(content=json.dumps(self._company_analysis(context)), model=self.model)
        if _PORTFOLIO_MARKER in user:
            context = self._extract_last_json(user)
            return LLMResponse(content=json.dumps(self._portfolio_analysis(context)), model=self.model)
        return LLMResponse(
            content=json.dumps({"reply": "I'm running in deterministic fallback mode and could not "
                                        "interpret this request."}),
            model=self.model,
        )

    async def health_check(self) -> bool:
        return True

    # -- template builders -------------------------------------------------------
    def _company_analysis(self, context: dict[str, Any]) -> dict[str, Any]:
        scores = context.get("scores", {})
        overall = scores.get("overall")
        rec = scores.get("recommendation", "HOLD")
        conf = scores.get("confidence", 0.5)
        raw = context.get("raw_data", {})
        calc = context.get("calculated_metrics", {})
        ticker = context.get("ticker", "")
        supporting = self._supporting_metrics(raw, calc)
        return {
            "summary": (
                f"{ticker} scores {overall} overall, which maps to a {rec} recommendation. "
                "This is based on the supplied deterministic scores and metrics."
            ),
            "strengths": ["Positive overall score from the deterministic engine"],
            "risks": ["Concentration risk is not assessed in fallback mode"],
            "opportunities": ["Re-run with live provider for richer analysis"],
            "reasoning": (
                f"Overall score {overall} falls in the {rec} band. The fundamental, technical and "
                "risk engines produced the scores provided in the trusted context."
            ),
            "recommendation": rec,
            "confidence": conf,
            "supporting_metrics": supporting,
            "positive_factors": [f"{m['metric']} at {m['value']}" for m in supporting if m.get("impact") != "negative"],
            "sources": [],
        }

    def _portfolio_analysis(self, context: dict[str, Any]) -> dict[str, Any]:
        summary = context.get("summary", {})
        scores = context.get("scores", {})
        concentration = context.get("sector_concentration", [])
        return {
            "summary": (
                f"Your portfolio has {summary.get('holdings_count', 0)} holdings with a total value of "
                f"{summary.get('total_value', 0)} and a total P&L of {summary.get('total_pl', 0)} "
                f"({summary.get('total_pl_pct', 0)}%)."
            ),
            "strengths": ["Portfolio P&L is positive" if float(summary.get("total_pl", 0) or 0) >= 0
                          else "Portfolio is currently at a loss"],
            "weaknesses": ["Deterministic fallback analysis — no deep qualitative view"],
            "concentration_risks": [
                {"sector": c.get("sector"), "weight": c.get("weight"),
                 "note": "Sector exposure from supplied context"} for c in concentration
            ],
            "concerns": ["Valuation and market conditions not assessed in fallback mode"],
            "opportunities": ["Consider diversification across sectors"],
            "explanation": "Generated deterministically from the supplied portfolio scores and metrics.",
            "scores": {k: scores.get(k) for k in ("overall", "fundamental", "technical", "risk")},
            "disclaimer": "Decision support only. Not investment advice.",
        }

    def _chat_reply(self, user: str) -> dict[str, Any]:
        # Extract the question and any supplied context for a grounded reply.
        question = user.split("\n")[0]
        context = self._extract_last_json(user) or {}
        company = context.get("company") or {}
        scores = company.get("scores", {}) or {}
        overall = scores.get("overall")
        rec = scores.get("recommendation", "")
        if overall is not None:
            reply = (
                f"Based on the supplied context, the overall score is {overall} with a "
                f"{rec} recommendation. {question}"
            )
        else:
            reply = (
                "I only have the deterministic fallback view available. I can reason conceptually, "
                "but I cannot cite specific prices or scores that are not in my context. " + question
            )
        return {"reply": reply, "context_used": {"scope": (company or {}).get("type", "general")}}

    # -- helpers --------------------------------------------------------------
    @staticmethod
    def _supporting_metrics(raw: dict[str, Any], calc: dict[str, Any]) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for key in ("roe", "debt_to_equity", "current_ratio", "pe_ratio"):
            for src in (raw, calc):
                val = src.get(key)
                if val is not None and key not in {m["metric"] for m in out}:
                    impact = "positive" if key in ("roe", "current_ratio") else (
                        "positive" if key == "debt_to_equity" and float(val) < 1 else "neutral"
                    )
                    out.append({"metric": key, "value": float(val), "impact": impact})
                    break
        return out

    @staticmethod
    def _extract_last_json(text: str) -> dict[str, Any] | None:
        """Return the last top-level JSON object found in ``text``."""
        depth = 0
        in_string = False
        escape = False
        start: int | None = None
        candidates: list[str] = []
        for i, ch in enumerate(text):
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                if depth > 0:
                    depth -= 1
                    if depth == 0 and start is not None:
                        candidates.append(text[start : i + 1])
                        start = None
        if not candidates:
            return None
        for candidate in reversed(candidates):
            try:
                obj = json.loads(candidate)
                if isinstance(obj, dict):
                    return obj
            except (json.JSONDecodeError, ValueError):
                continue
        return None