"""Implementation for the game-level possession-creation endpoint (issue #1074)."""

from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import GamePossession
from ...serializers import GamePossessionDetailFullSerializer
from ..common import validated_or_error


class _GamePossessionCreateSerializer(serializers.Serializer):
    """Validate the name/description/hidden payload for creating a bare game possession."""

    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def game_possession_create(request, game):
    """Create a new GamePossession for `game`."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_possession', 'regular', 'create',
    )
    if error_response:
        return error_response

    serializer = _GamePossessionCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    possession = GamePossession.objects.create(game=game, **serializer.validated_data)
    return Response(GamePossessionDetailFullSerializer(possession).data, status=201)
