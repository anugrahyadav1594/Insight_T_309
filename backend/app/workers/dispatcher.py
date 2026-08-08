"""TaskDispatcher abstraction (ARCHITECTURE.md §21).

Phase 1 uses FastAPI ``BackgroundTasks``; the signature matches a Celery-shaped
interface so workers can be introduced in Phase 2 without changing callers.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Protocol

from fastapi import BackgroundTasks

from app.workers.tasks import TASK_REGISTRY

logger = logging.getLogger("insight.workers")


class TaskDispatcher(Protocol):
    """Minimal task-submission interface."""

    def submit(self, task_name: str, *args: Any, **kwargs: Any) -> None: ...


class BackgroundTaskDispatcher:
    """Phase-1 dispatcher backed by FastAPI ``BackgroundTasks``."""

    def __init__(self, background_tasks: BackgroundTasks) -> None:
        self._background_tasks = background_tasks

    def submit(self, task_name: str, *args: Any, **kwargs: Any) -> None:
        task: Callable[..., Any] | None = TASK_REGISTRY.get(task_name)
        if task is None:
            logger.warning("unknown task name: %s", task_name)
            return
        self._background_tasks.add_task(task, *args, **kwargs)


class NullDispatcher:
    """No-op dispatcher (e.g. when background tasks are disabled)."""

    def submit(self, task_name: str, *args: Any, **kwargs: Any) -> None:
        return None


def get_dispatcher(background_tasks: BackgroundTasks) -> TaskDispatcher:
    """Build a dispatcher bound to the request's background tasks."""
    return BackgroundTaskDispatcher(background_tasks)