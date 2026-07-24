"""Implementation for the game-level item-creation endpoint (issue #784)."""

from rest_framework import serializers
from rest_framework.response import Response

from ...models import GameItem
from ...permissions import GameItemCreatePermission
from ...serializers import GameItemDetailFullSerializer
from ..common import validated_or_error


class _GameItemCreateSerializer(serializers.Serializer):
    """Validate the name/description/hidden payload for creating a bare game item."""

    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def game_item_create(request, game):
    """Create a new GameItem for `game`, with no owning CharacterItem."""
    error_response = GameItemCreatePermission.check(request, game)
    if error_response:
        return error_response

    serializer = _GameItemCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    item = GameItem.objects.create(game=game, **serializer.validated_data)
    return Response(GameItemDetailFullSerializer(item).data, status=201)
