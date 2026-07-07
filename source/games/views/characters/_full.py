"""Shared implementation for the character full (private-description-included) endpoint."""

from rest_framework.response import Response

from ...permissions import CharacterEditPermission
from ...serializers import CharacterFullSerializer
from ._shared import _get_character_or_404


def character_full(request, game, character_id, npc):
    """Return full detail (including private description) for a specific character."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterFullSerializer(character, context={'request': request})
    response = Response(serializer.data)
    response['X-Skip-Cache'] = 'true'
    return response
