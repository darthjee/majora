"""View for linking an existing catalog treasure to a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...models import Game, GameTreasure
from ...serializers import GameTreasureLinkSerializer, TreasureDetailSerializer
from ..common import check_game_edit, validate_with_hidden_field


@api_view(['POST'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_treasure_link(request, game_slug):
    """Validate the request and link an existing treasure to `game`, returning 201 detail."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response

    serializer = GameTreasureLinkSerializer(data=request.data, context={'game': game})
    hidden_serializer, error_response = validate_with_hidden_field(serializer, request.data)
    if error_response:
        return error_response

    treasure = serializer.validated_data['treasure_id']
    GameTreasure.objects.create(
        game=game,
        treasure=treasure,
        value=serializer.validated_data['value'],
        max_units=serializer.validated_data.get('max_units'),
        hidden=hidden_serializer.validated_data.get('hidden', False),
    )
    detail = TreasureDetailSerializer(treasure, context={'game': game})
    return Response(detail.data, status=201)
