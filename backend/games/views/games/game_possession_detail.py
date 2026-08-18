"""View for retrieving a single non-hidden possession, or updating any, in a game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import Game
from ...serializers import (
    GamePossessionDetailFullSerializer,
    GamePossessionDetailSerializer,
    GamePossessionUpdateSerializer,
)
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
# AllowAny: GET is intentionally public (hidden possessions excluded below); PATCH
# authorization is enforced inline via EndpointPermission.check().
@permission_classes([AllowAny])
def game_possession_detail(request, game_slug, possession_id):
    """Return detail for, or update, a single possession belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return _update_possession(request, game, possession_id)
    possession = get_object_or_404(game.possessions.filter(hidden=False), id=possession_id)
    return Response(GamePossessionDetailSerializer(possession).data)


def _update_possession(request, game, possession_id):
    """Check edit permission, validate the payload, persist it, and return the possession."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_possession', 'regular', 'edit',
    )
    if error_response:
        return error_response

    possession = get_object_or_404(game.possessions.all(), id=possession_id)
    serializer = GamePossessionUpdateSerializer(possession, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GamePossessionDetailFullSerializer(possession).data)
