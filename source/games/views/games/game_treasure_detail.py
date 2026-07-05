"""View for retrieving or updating a treasure exclusive to a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, Treasure
from ...permissions import GameEditPermission
from ...serializers import TreasureDetailSerializer, TreasureUpdateSerializer
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authorization is enforced inline via
# GameEditPermission.check() against the resolved game — distinct from, and does not
# alter, the superuser-only `/treasures/<id>.json` endpoint.
@permission_classes([AllowAny])
def game_treasure_detail(request, game_slug, treasure_id):
    """Return or update detail for a treasure exclusive to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    treasure = get_object_or_404(Treasure, id=treasure_id, game=game)

    if request.method == 'PATCH':
        return _update_game_treasure(request, game, treasure)

    return Response(TreasureDetailSerializer(treasure).data)


def _update_game_treasure(request, game, treasure):
    """Validate permission and payload, persist the update, then return the detail Response."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(TreasureDetailSerializer(treasure).data)
