"""Shared implementation for the PC-only, player-writable regular update endpoint (issue #865)."""

from ...permissions import EndpointPermission
from ...serializers import CharacterDetailSerializer, CharacterRegularUpdateSerializer
from ..common import detail_or_update


def _check_regular_edit(request, character):
    """Return an error Response if `request.user` may not perform this PC update, else None."""
    return EndpointPermission(request.user, game=character.game, pc=character).check(
        request, 'game_pc', 'regular', 'regular_edit',
    )


def character_regular_update(request, character):
    """Update the narrow, player-writable field set for a PC."""
    response = detail_or_update(
        request, character, _check_regular_edit,
        CharacterRegularUpdateSerializer, CharacterDetailSerializer,
        detail_context={'request': request},
    )
    # This endpoint is PATCH-only in practice, and the whole response is gated behind
    # _check_regular_edit(), so it must never be cached/shared across requesters by Tent's
    # identity-blind reverse-proxy cache, which would otherwise replay one caller's
    # authorized response to any subsequent, unauthorized caller of the same URL.
    response['X-Skip-Cache'] = 'true'
    return response
