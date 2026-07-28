"""Shared implementation for the character full (private-description-included) endpoint."""

from ...permissions import CharacterEditPermission
from ...serializers import CharacterFullSerializer, CharacterUpdateSerializer
from ..common import detail_or_update
from ._shared import _get_character_or_404


def character_full(request, game, character_id, npc):
    """Return or update full detail (including private description) for a specific character."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    response = detail_or_update(
        request,
        character,
        CharacterEditPermission,
        CharacterUpdateSerializer,
        CharacterFullSerializer,
        detail_context={'request': request},
    )
    # The entire response (GET and PATCH) is gated behind CharacterEditPermission.check()
    # above, so it must never be cached/shared across requesters by Tent's identity-blind
    # reverse-proxy cache, which would otherwise replay one caller's authorized response to
    # any subsequent, unauthorized caller of the same URL.
    response['X-Skip-Cache'] = 'true'
    return response
