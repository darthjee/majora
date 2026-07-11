"""Shared implementation for the NPC slain toggle endpoint."""

from rest_framework.response import Response

from ...permissions import CharacterEditPermission
from ...serializers import CharacterSlainUpdateSerializer
from ..common import validated_or_error
from ._shared import _get_character_or_404


def character_slain_set(request, game, character_id, npc):
    """Toggle the slain flag on a character to the value given in the request body."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterSlainUpdateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    validated_data = serializer.validated_data
    if 'slain' in validated_data:
        character.slain = validated_data['slain']
    if 'public_slain' in validated_data:
        character.public_slain = validated_data['public_slain']
    character.save()

    return Response({'slain': character.slain, 'public_slain': character.public_slain}, status=200)
