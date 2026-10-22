"""Helpers enforcing a scoped API token's game list inside views that resolve the game."""

from accounts.authentication import GameNotAllowed
from accounts.models import ApiToken


def token_game_ids(request):
    """Return the scoped token's game ids, or None when unrestricted (no token / empty list)."""
    api_token = getattr(request, 'auth', None)
    if not isinstance(api_token, ApiToken):
        return None
    return list(api_token.games.values_list('id', flat=True)) or None


def check_token_game(request, game_id):
    """Raise `GameNotAllowed` when the request's token restricts games and `game_id` is off it.

    A `None` `game_id` (an object owned by no game) and requests not authenticated by a scoped
    token with a non-empty game list always pass.
    """
    if game_id is None:
        return
    game_ids = token_game_ids(request)
    if game_ids is not None and game_id not in game_ids:
        raise GameNotAllowed()
