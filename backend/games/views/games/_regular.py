"""Shared implementation for the game regular (staff/player) update tier (issue #891)."""

from ...permissions import EndpointPermission
from ...serializers import GameDetailSerializer, GameRegularUpdateSerializer
from ..common import detail_or_update


def check_game_regular_edit(request, game):
    """Return an error Response if `request.user` may not perform the regular game edit."""
    return EndpointPermission(request.user, game=game).check(
        request, 'game', 'regular', 'regular_edit',
    )


def game_regular_update(request, game):
    """Update the narrow (description/links) field set for a game."""
    return detail_or_update(
        request, game, check_game_regular_edit, GameRegularUpdateSerializer, GameDetailSerializer,
    )
