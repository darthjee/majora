"""Views for game session endpoints."""

from .game_session_detail import game_session_detail
from .game_sessions_list import game_sessions_list

__all__ = [
    'game_sessions_list',
    'game_session_detail',
]
