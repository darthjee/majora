"""View for retrieving a single non-hidden item, or updating any item, in a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import (
    GameItemDetailFullSerializer,
    GameItemDetailSerializer,
    GameItemUpdateSerializer,
)
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public (hidden items excluded below); PATCH authorization
# is enforced inline via GameEditPermission.check().
@permission_classes([AllowAny])
def game_item_detail(request, game_slug, item_id):
    """Return detail for, or update, a single item belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return _update_item(request, game, item_id)
    item = get_object_or_404(game.items.filter(hidden=False), id=item_id)
    return Response(GameItemDetailSerializer(item).data)


def _update_item(request, game, item_id):
    """Check dm/admin permission, validate the payload, persist it, and return the item."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    item = get_object_or_404(game.items.all(), id=item_id)
    serializer = GameItemUpdateSerializer(item, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GameItemDetailFullSerializer(item).data)
