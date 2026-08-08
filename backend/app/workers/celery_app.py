"""Celery placeholder — Phase 2 only (ARCHITECTURE.md §21.2).

Not implemented in Phase 1; the same ``submit(task_name, ...)`` signature is
used by :class:`app.workers.dispatcher.BackgroundTaskDispatcher` today, so
swapping to Celery is a one-file change.
"""

from __future__ import annotations

# Phase 2: broker = settings.REDIS_URL; task decorators wrap TASK_REGISTRY entries.