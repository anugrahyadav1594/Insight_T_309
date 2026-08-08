"""Tests for the AI response validator (§24.2). Pure — no DB required."""

from __future__ import annotations

import pytest

from app.ai.response_validator import ResponseValidator, extract_json
from app.schemas.screener import ScreenerFilter

validator = ResponseValidator()

CONTEXT = {
    "ticker": "TCS",
    "raw_data": {"roe": 27.4, "pe_ratio": 24.5, "debt_to_equity": 0.09},
    "calculated_metrics": {"revenue_growth": 8.9},
    "scores": {
        "overall": 74.6,
        "fundamental": 81.4,
        "technical": 70.8,
        "risk": 64.1,
        "recommendation": "HOLD",
    },
}


def test_extract_json_from_fenced_content():
    content = "```json\n{\"a\": 1}\n```"
    assert extract_json(content) == {"a": 1}


def test_company_analysis_recommendation_overridden():
    content = (
        '{"summary": "s", "strengths": [], "risks": [], "opportunities": [], '
        '"reasoning": "r", "recommendation": "STRONG_BUY", "confidence": 0.99, '
        '"supporting_metrics": [], "positive_factors": []}'
    )
    result = validator.validate_company_analysis(content, CONTEXT)
    # Deterministic band for 74.6 is HOLD — the LLM's STRONG_BUY must be overridden.
    assert result["recommendation"] == "HOLD"


def test_company_analysis_numeric_crosscheck_corrects_value():
    content = (
        '{"summary": "s", "strengths": [], "risks": [], "opportunities": [], '
        '"reasoning": "r", "recommendation": "HOLD", "confidence": 0.9, '
        '"supporting_metrics": [{"metric": "roe", "value": 99.0, "impact": "positive"}], '
        '"positive_factors": []}'
    )
    result = validator.validate_company_analysis(content, CONTEXT)
    # The inflated ROE must be corrected to the trusted 27.4.
    assert result["supporting_metrics"][0]["value"] == 27.4


def test_chat_reply_validation():
    result = validator.validate_chat_reply(
        '{"reply": "TCS scores 74.6", "context_used": {"ticker": "TCS"}}', CONTEXT
    )
    assert result["reply"] == "TCS scores 74.6"
    assert result["context_used"]["ticker"] == "TCS"


def test_chat_reply_rejects_empty():
    with pytest.raises(ValueError):
        validator.validate_chat_reply('{"reply": "   "}', CONTEXT)


def test_screener_filter_drops_disallowed_keys():
    filter_obj = validator.validate_screener_filter(
        '{"sector": "Technology", "roe_min": 20, "drop table": "users"}'
    )
    assert isinstance(filter_obj, ScreenerFilter)
    assert filter_obj.sector == "Technology"
    assert filter_obj.roe_min == 20