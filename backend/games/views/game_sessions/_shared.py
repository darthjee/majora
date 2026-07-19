"""Shared implementation for the game-session list views (future/past/unscheduled)."""

from django.shortcuts import get_object_or_404

from ...models import Game
from ...serializers import GameSessionListSerializer
from ..common import paginated_list_response


def game_sessions_list_response(request, game_slug, scope_sessions):
    """Return the paginated session-list Response for `game_slug`, scoped by `scope_sessions`.

    `scope_sessions` is called with the game's `sessions` queryset and must return the
    filtered/ordered queryset for the specific list variant (future/past/unscheduled).
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    sessions = scope_sessions(game.sessions)
    return paginated_list_response(request, sessions, GameSessionListSerializer)
