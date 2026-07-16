"""Views for game polls."""

from .game_poll_detail import game_poll_detail
from .game_poll_votes import game_poll_votes
from .game_polls_list import game_polls_list

__all__ = [
    'game_poll_detail',
    'game_poll_votes',
    'game_polls_list',
]
