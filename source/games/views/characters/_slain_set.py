"""Shared implementation for the NPC slain toggle endpoint."""

from django.http import Http404
from rest_framework.response import Response

from ...permissions import CharacterEditPermission
from ...serializers import CharacterSlainUpdateSerializer
from ..common import validated_or_error
from ._shared import _find_character


def character_slain_set(request, game, character_id, npc):
    """Toggle the slain flag on a character to the value given in the request body."""
    character = _find_character(game, character_id, npc)
    if character is None:
        raise Http404

    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterSlainUpdateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character.slain = serializer.validated_data['slain']
    character.save()

    return Response({'slain': character.slain}, status=200)
