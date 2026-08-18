"""View for retrieving a single non-hidden common item, or updating any, in a game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from permissions import EndpointPermission

from ...models import Game
from ...serializers import (
    GameCommonItemDetailFullSerializer,
    GameCommonItemDetailSerializer,
    GameCommonItemUpdateSerializer,
)
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public (hidden common items excluded below); PATCH
# authorization is enforced inline via EndpointPermission.check().
@permission_classes([AllowAny])
def game_common_item_detail(request, game_slug, common_item_id):
    """Return detail for, or update, a single common item belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return _update_common_item(request, game, common_item_id)
    common_item = get_object_or_404(game.common_items.filter(hidden=False), id=common_item_id)
    return Response(GameCommonItemDetailSerializer(common_item).data)


def _update_common_item(request, game, common_item_id):
    """Check edit permission, validate the payload, persist it, and return the common item."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_common_item', 'regular', 'edit',
    )
    if error_response:
        return error_response

    common_item = get_object_or_404(game.common_items.all(), id=common_item_id)
    serializer = GameCommonItemUpdateSerializer(common_item, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GameCommonItemDetailFullSerializer(common_item).data)
