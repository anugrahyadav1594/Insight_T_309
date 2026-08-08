"""ContextBuilder — assembles TRUSTED structured context for the LLM.

The AI layer receives only backend-normalized, engine-verified data assembled
here (ARCHITECTURE.md §15.2). It never takes numbers from the model's memory;
any number the model may quote must exist in the supplied context, and the
response validator cross-checks numeric claims against it.
"""

from __future__ import annotations

from typing import Any, Mapping


def _compact_scores(scores: Mapping[str, Any]) -> dict[str, Any]:
    """Flatten engine ScoreResult objects into plain nested dicts."""
    return {
        "overall": scores.get("overall", {}).get("score"),
        "fundamental": scores.get("fundamental", {}).get("score"),
        "technical": scores.get("technical", {}).get("score"),
        "risk": scores.get("risk", {}).get("score"),
        "recommendation": scores.get("overall", {}).get("recommendation"),
        "confidence": scores.get("overall", {}).get("confidence"),
        "breakdown": {
            "fundamental": scores.get("fundamental", {}).get("breakdown"),
            "technical": scores.get("technical", {}).get("breakdown"),
            "risk": scores.get("risk", {}).get("breakdown"),
        },
    }


def build_company_context(
    *,
    ticker: str,
    identity: Mapping[str, Any] | None = None,
    raw_data: Mapping[str, Any] | None = None,
    calculated_metrics: Mapping[str, Any] | None = None,
    scores: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the trusted context for a company-analysis chat / report."""
    return {
        "type": "company",
        "ticker": ticker,
        "identity": dict(identity or {}),
        "raw_data": dict(raw_data or {}),
        "calculated_metrics": dict(calculated_metrics or {}),
        "scores": _compact_scores(scores or {}),
    }


def build_portfolio_context(
    *,
    summary: Mapping[str, Any],
    sector_concentration: list[Mapping[str, Any]],
    scores: Mapping[str, Any],
    holdings: list[Mapping[str, Any]],
) -> dict[str, Any]:
    """Build the trusted context for a portfolio-analysis report."""
    return {
        "type": "portfolio",
        "summary": dict(summary),
        "sector_concentration": list(sector_concentration),
        "scores": {
            "overall": scores.get("overall"),
            "fundamental": scores.get("fundamental"),
            "technical": scores.get("technical"),
            "risk": scores.get("risk"),
            "confidence": scores.get("confidence"),
        },
        "holdings": list(holdings),
    }


def build_chat_context(
    *,
    scope: str,
    company_context: dict[str, Any] | None = None,
    portfolio_context: dict[str, Any] | None = None,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Bundle whatever context is relevant for a chat turn."""
    return {
        "scope": scope,
        "company": company_context,
        "portfolio": portfolio_context,
        "history": history or [],
    }
