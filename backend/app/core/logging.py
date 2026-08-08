"""Structured logging with a secret-redaction filter.

The redaction filter scans every log record for known secret-bearing query
parameters and header values and replaces them with ``[REDACTED]`` so that
API keys, tokens and passwords never reach the logs (ARCHITECTURE.md §22).
"""

from __future__ import annotations

import logging
import re

from .config import settings

# Parameters/header names whose values must never be logged.
_SENSITIVE_NAMES = {
    "apikey",
    "api_key",
    "key",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "password",
    "secret",
    "cookie",
    "jwt",
}

_SENSITIVE_KEY_RE = re.compile(
    r"(" + "|".join(re.escape(n) for n in sorted(_SENSITIVE_NAMES, key=len, reverse=True)) + r")",
    re.IGNORECASE,
)

_QUERY_VALUE_RE = re.compile(r"([?&](?:[^&=]*=)?)(api[_-]?key|token|password|secret)=([^&\s]+)", re.IGNORECASE)


class SecretRedactionFilter(logging.Filter):
    """Drop sensitive values from structured log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        for attr in ("msg", "message"):
            raw = getattr(record, attr, None)
            if isinstance(raw, str):
                setattr(record, attr, self._redact(raw))
        # Redact fields inside the extra args dict (if any).
        for key in list(getattr(record, "args", ()) if isinstance(getattr(record, "args", None), dict) else []):
            if _SENSITIVE_KEY_RE.search(key):
                record.args[key] = "[REDACTED]"  # type: ignore[index]
        return True

    @staticmethod
    def _redact(text: str) -> str:
        text = _QUERY_VALUE_RE.sub(r"\1\2=[REDACTED]", text)
        # Redact "name=value" where name is sensitive, unless already redacted.
        return re.sub(
            r"(?i)([?&\s])(api[_-]?key|token|password|secret|authorization)=([^&\s&]+)",
            r"\1\2=[REDACTED]",
            text,
        )


def _get_console_handler() -> logging.Handler:
    import sys

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        fmt="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    ))
    handler.addFilter(SecretRedactionFilter())
    return handler


def configure_logging() -> None:
    """Configure the root logger once (safe to call multiple times)."""
    root = logging.getLogger()
    root.setLevel(settings.LOG_LEVEL.upper())
    # Avoid duplicate handlers on re-invocation.
    for handler in list(root.handlers):
        root.removeHandler(handler)
    root.addHandler(_get_console_handler())
    # Silence noisy libraries.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger for ``name``."""
    configure_logging()
    return logging.getLogger(name)
