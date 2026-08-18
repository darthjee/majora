"""View for retrieving a single faction, or updating it, in a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import Game
from ...serializers import GameFactionListSerializer, GameFactionUpdateSerializer
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
# AllowAny: GET is intentionally public; PATCH authorization is enforced inline via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_faction_detail(request, game_slug, faction_id):
    """Return detail for, or update, a single faction belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return _update_faction(request, game, faction_id)
    faction = get_object_or_404(game.factions.all(), id=faction_id)
    return Response(GameFactionListSerializer(faction).data)


def _update_faction(request, game, faction_id):
    """Check edit permission, validate the payload, persist it, and return the faction."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_faction', 'regular', 'edit',
    )
    if error_response:
        return error_response

    faction = get_object_or_404(game.factions.all(), id=faction_id)
    serializer = GameFactionUpdateSerializer(faction, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GameFactionListSerializer(faction).data)
