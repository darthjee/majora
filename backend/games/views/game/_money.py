"""Shared implementation for the character money-only update endpoint (issue #615)."""

from rest_framework.response import Response

from ...permissions import EndpointPermission
from ...serializers import CharacterDetailSerializer, CharacterMoneyUpdateSerializer
from ..common import save_or_error, validated_or_error
from ._shared import _character_resource


def character_money_update(request, character):
    """Update `character`'s money through the narrow, money-only PUT endpoint.

    PC: regular tier (staff/player/owner). NPC: restricted tier, staff only (issue #625's
    "any player of the game" leniency is PC-only).
    """
    type_ = 'regular' if character.is_pc else 'restricted'
    error_response = EndpointPermission(request.user, game=character.game, pc=character).check(
        request, _character_resource(character), type_, 'money_edit',
    )
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
    # The whole response is gated behind the money_edit permission check above, so it
    # must never be cached/shared across requesters by Tent's identity-blind reverse-proxy
    # cache, which would otherwise replay one caller's authorized response to any
    # subsequent, unauthorized caller of the same URL.
    response['X-Skip-Cache'] = 'true'
    return response
