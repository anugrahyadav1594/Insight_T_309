"""ResponseValidator — validates LLM output, cross-checks numbers and enforces
the deterministic recommendation (ARCHITECTURE.md §16.2).

* Parses the LLM JSON (tolerating markdown fences).
* Validates against the relevant Pydantic schema.
* Cross-checks any numeric claim in ``supporting_metrics`` against the trusted
  context; mismatches are corrected or dropped.
* Overrides the ``recommendation`` with the deterministic band derived from the
  supplied overall score.
"""

from __future__ import annotations

import json
import re
from typing import Any, Mapping

from app.engines.recommendation import recommend
from app.schemas.ai import (
    CompanyAnalysisReply,
    PortfolioAnalysisResponse,
)
from app.schemas.screener import ScreenerFilter

_TOLERANCE = 1e-6


def extract_json(content: str) -> dict[str, Any] | None:
    """Extract the first JSON object from ``content`` (strips markdown fences)."""
    text = content.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        obj = json.loads(text[start : end + 1])
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        return None


def _cross_check_metrics(
    supporting: list[dict[str, Any]],
    raw_data: Mapping[str, Any],
    calculated: Mapping[str, Any],
) -> list[dict[str, Any]]:
    """Correct or drop supporting-metric values that don't match the context."""
    cleaned: list[dict[str, Any]] = []
    for item in supporting:
        name = item.get("metric")
        value = item.get("value")
        if name is None or value is None:
            continue
        ctx_value = raw_data.get(name, calculated.get(name))
        if ctx_value is None:
            # Value not present in context — cannot verify; keep only name+impact without a number.
            continue
        try:
            ctx_num = float(ctx_value)
            llm_num = float(value)
        except (TypeError, ValueError):
            continue
        if abs(llm_num - ctx_num) > _TOLERANCE:
            item["value"] = ctx_num  # correct to the trusted value
        cleaned.append({"metric": name, "value": item["value"], "impact": item.get("impact", "neutral")})
    return cleaned


class ResponseValidator:
    """Validates and normalizes LLM JSON responses."""

    # -- company analysis (§16) -------------------------------------------------
    def validate_company_analysis(
        self, content: str, context: Mapping[str, Any]
    ) -> dict[str, Any]:
        obj = extract_json(content)
        if obj is None:
            raise ValueError("LLM did not return a JSON object")

        scores = context.get("scores", {}) or {}
        overall = scores.get("overall")
        if overall is None:
            raise ValueError("no overall score in context to enforce recommendation")

        deterministic = recommend(float(overall))
        obj["recommendation"] = deterministic

        raw_data = context.get("raw_data", {}) or {}
        calculated = context.get("calculated_metrics", {}) or {}
        if isinstance(obj.get("supporting_metrics"), list):
            obj["supporting_metrics"] = _cross_check_metrics(
                obj["supporting_metrics"], raw_data, calculated
            )

        confidence = obj.get("confidence")
        if confidence is not None:
            obj["confidence"] = max(0.0, min(1.0, float(confidence)))

        validated = CompanyAnalysisReply(**obj)
        return validated.model_dump()

    # -- portfolio analysis (§12) ------------------------------------------------
    def validate_portfolio_analysis(self, content: str, context: Mapping[str, Any]) -> dict[str, Any]:
        obj = extract_json(content)
        if obj is None:
            raise ValueError("LLM did not return a JSON object")
        validated = PortfolioAnalysisResponse(**obj)
        return validated.model_dump()

    # -- chat (§15) ---------------------------------------------------------------
    def validate_chat_reply(self, content: str, context: Mapping[str, Any]) -> dict[str, Any]:
        obj = extract_json(content)
        if obj is None:
            raise ValueError("LLM did not return a JSON object")
        reply = str(obj.get("reply", ""))
        context_used = obj.get("context_used") or {}
        if not reply.strip():
            raise ValueError("LLM returned an empty reply")
        return {"reply": reply, "context_used": context_used}

    # -- NL screener (§14) ---------------------------------------------------------
    def validate_screener_filter(self, content: str) -> ScreenerFilter:
        obj = extract_json(content)
        if obj is None:
            raise ValueError("LLM did not return a JSON filter object")
        # Drop any disallowed keys before strict validation.
        allowed = set(ScreenerFilter.model_fields)
        cleaned = {k: v for k, v in obj.items() if k in allowed}
        return ScreenerFilter(**cleaned)