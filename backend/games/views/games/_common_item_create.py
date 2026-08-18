"""Implementation for the game-level common item-creation endpoint (issue #826)."""

from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import GameCommonItem
from ...serializers import GameCommonItemDetailFullSerializer
from ..common import validated_or_error


class _GameCommonItemCreateSerializer(serializers.Serializer):
    """Validate the name/price/description/category/hidden payload for creating a common item."""

    name = serializers.CharField(max_length=200)
    price = serializers.IntegerField()
    description = serializers.CharField(required=False, default='', allow_blank=True)
    category = serializers.ChoiceField(
        choices=GameCommonItem.CATEGORY_CHOICES, required=False,
        default=GameCommonItem.CATEGORY_OTHER,
    )
    hidden = serializers.BooleanField(required=False, default=False)


def game_common_item_create(request, game):
    """Create a new GameCommonItem for `game`."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_common_item', 'regular', 'create',
    )
    if error_response:
        return error_response

    serializer = _GameCommonItemCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    common_item = GameCommonItem.objects.create(game=game, **serializer.validated_data)
    return Response(GameCommonItemDetailFullSerializer(common_item).data, status=201)
