"""View for retrieving a single faction, or updating it, in a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import FactionListSerializer, FactionUpdateSerializer
from ..common import check_game_edit, validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authorization is enforced inline via
# check_game_edit (DM/superuser only).
@permission_classes([AllowAny])
def game_faction_detail(request, game_slug, faction_id):
    """Return detail for, or update, a single faction belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return _update_faction(request, game, faction_id)
    faction = get_object_or_404(game.factions.all(), id=faction_id)
    return Response(FactionListSerializer(faction).data)


def _update_faction(request, game, faction_id):
    """Check dm/admin permission, validate the payload, persist it, and return the faction."""
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response

    faction = get_object_or_404(game.factions.all(), id=faction_id)
    serializer = FactionUpdateSerializer(faction, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(FactionListSerializer(faction).data)
