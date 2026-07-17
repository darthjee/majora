"""Shared implementation for the character money-only update endpoint (issue #615)."""

from rest_framework.response import Response

from ...permissions import CharacterMoneyEditPermission
from ...serializers import CharacterDetailSerializer, CharacterMoneyUpdateSerializer
from ..common import save_or_error, validated_or_error


def character_money_update(request, character):
    """Update `character`'s money through the narrow, money-only PUT endpoint."""
    error_response = CharacterMoneyEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterMoneyUpdateSerializer(character, data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    _, error_response = save_or_error(serializer)
    if error_response:
        return error_response

    response = Response(CharacterDetailSerializer(character, context={'request': request}).data)
    response['X-Skip-Cache'] = 'true'
    return response
