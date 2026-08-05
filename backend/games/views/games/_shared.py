"""Dispatch a game PATCH between its restricted (full) and regular update tiers (issue #891)."""

from ..common import check_game_edit
from ._full import game_full_update
from ._regular import check_game_regular_edit, game_regular_update


def game_update(request, game):
    """Route a game PATCH to the restricted tier, falling back to the regular tier.

    Tries the restricted (dm/admin) check first; a caller failing that but passing the
    regular (staff/player) check gets the narrower `GameRegularUpdateSerializer` field set.
    A caller failing both gets the regular tier's 401/403 error Response.
    """
    if check_game_edit(request, game) is None:
        return game_full_update(request, game)

    regular_error = check_game_regular_edit(request, game)
    if regular_error is None:
        return game_regular_update(request, game)
    return regular_error
