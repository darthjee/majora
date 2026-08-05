"""Shared implementation for the game full (dm/admin) update tier."""

from ...serializers import GameDetailSerializer, GameUpdateSerializer
from ..common import check_game_edit, detail_or_update


def game_full_update(request, game):
    """Update the full (name/description/links) field set for a game."""
    return detail_or_update(
        request, game, check_game_edit, GameUpdateSerializer, GameDetailSerializer,
    )
