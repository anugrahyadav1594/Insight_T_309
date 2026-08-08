"""PromptService — builds system/user prompts with guardrails and few-shot examples.

The LLM never invents numbers: the system prompt instructs it to only use the
supplied context, never to emit SQL, and to output decision-support language.
"""

from __future__ import annotations

import json
from typing import Any

GUARDRAILS = (
    "You are INSIGHT, an explainable financial-intelligence assistant for Indian retail investors.\n"
    "RULES (hard constraints):\n"
    "1. Never state a price, metric value, or score that is not in the provided context.\n"
    "2. If asked for a number that is not supplied, say it is outside your data window.\n"
    "3. Never emit SQL. Never attempt to query any database or external API.\n"
    "4. Do not modify the provided scores or recommendation. The recommendation is fixed by a "
    "deterministic engine; you only explain it.\n"
    "5. Output decision-support language only. You never execute trades and you never give "
    "guaranteed-profit promises. Always note that this is not investment advice.\n"
    "6. Answer in JSON matching the requested schema when JSON mode is requested.\n"
)


class PromptService:
    """Build structured prompts per intent."""

    def system_prompt(self) -> str:
        return GUARDRAILS

    # -- company analysis (explainability schema, §16) -------------------------
    def build_company_analysis_messages(self, context: dict[str, Any]) -> list[dict[str, str]]:
        system = self.system_prompt() + (
            "\n\nReturn a JSON object with exactly these keys: "
            "\"summary\", \"strengths\" (array), \"risks\" (array), \"opportunities\" (array), "
            "\"reasoning\", \"recommendation\" (must match the supplied deterministic recommendation), "
            "\"confidence\" (0-1), \"supporting_metrics\" (array of {metric, value, impact}) "
            "where each value must equal a value present in the context, "
            "\"positive_factors\" (array), and optional \"sources\" (array of {type,name,period,provider})."
        )
        user = (
            "Analyse this company using ONLY the following trusted context.\n"
            + json.dumps(context, default=str)
        )
        return [{"role": "system", "content": system}, {"role": "user", "content": user}]

    # -- portfolio analysis (§12) ----------------------------------------------
    def build_portfolio_analysis_messages(
        self, context: dict[str, Any], focus: str | None = None
    ) -> list[dict[str, str]]:
        system = self.system_prompt() + (
            "\n\nReturn a JSON object with exactly these keys: \"summary\", \"strengths\" (array), "
            "\"weaknesses\" (array), \"concentration_risks\" (array of {sector, weight, note}), "
            "\"concerns\" (array), \"opportunities\" (array), \"explanation\", "
            "\"scores\" (object with the supplied scores), \"disclaimer\" (must be "
            "'Decision support only. Not investment advice.')."
        )
        user = (
            "Analyse this portfolio using ONLY the supplied trusted context."
            + (f"\nFocus area: {focus}." if focus else "")
            + "\n" + json.dumps(context, default=str)
        )
        return [{"role": "system", "content": system}, {"role": "user", "content": user}]

    # -- chat (§15) --------------------------------------------------------------
    def build_chat_messages(
        self, scope: str, context: dict[str, Any], user_message: str
    ) -> list[dict[str, str]]:
        system = self.system_prompt() + (
            "\n\nReturn a JSON object with exactly these keys: "
            "\"reply\" (string), \"context_used\" (object listing the context fields you actually used)."
        )
        history_lines = "\n".join(f"{m['role']}: {m['content']}" for m in context.get("history", []))
        user = (
            f"Scope: {scope}. User question: {user_message}\n"
            f"Trusted context: {json.dumps(context, default=str)}\n"
            f"Conversation history:\n{history_lines or '(none)'}"
        )
        return [{"role": "system", "content": system}, {"role": "user", "content": user}]

    # -- natural-language screener (§14) ------------------------------------------
    def build_nl_screener_messages(self, natural_language: str) -> list[dict[str, str]]:
        system = (
            "You convert natural-language stock-screening requests into a structured filter object. "
            "NEVER emit SQL. Output a JSON object with keys chosen ONLY from: "
            "sector, exchange, market_cap_min, market_cap_max, pe_ratio_min, pe_ratio_max, "
            "roe_min, roe_max, revenue_growth_min, revenue_growth_max, debt_to_equity_min, "
            "debt_to_equity_max, fundamental_score_min, fundamental_score_max, technical_score_min, "
            "technical_score_max, risk_score_min, risk_score_max, overall_score_min, overall_score_max. "
            "Do not add any other keys. Percentages are numbers (20 means 20)."
        )
        user = f"Natural language request: {natural_language}\nReturn the JSON filter object only."
        return [{"role": "system", "content": system}, {"role": "user", "content": user}]