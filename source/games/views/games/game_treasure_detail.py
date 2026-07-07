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

    error_response = _hidden_gate_response(treasure, game, request)
    if error_response:
        return error_response

    if request.method == 'PATCH':
        response = _update_game_treasure(request, game, treasure)
    else:
        response = Response(TreasureDetailSerializer(treasure).data)

    if treasure.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def _hidden_gate_response(treasure, game, request):
    """Return a 404 Response with X-Skip-Cache set if treasure is hidden and game not editable."""
    if treasure.hidden and not game.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None


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
