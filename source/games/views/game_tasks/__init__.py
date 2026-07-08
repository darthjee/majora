"""Views for game task endpoints."""

from .game_task_detail import game_task_detail
from .game_tasks_list import game_tasks_list

__all__ = [
    'game_tasks_list',
    'game_task_detail',
]
