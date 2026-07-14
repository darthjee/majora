"""View for listing a game's DM assignments or creating a new one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameMaster
from ...serializers import GameMasterSerializer
from ..common import require_authenticated


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_masters_list(request, game_slug):
    """Return all DM assignments for a game, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        return _create_game_master(request, game)

    game_masters = game.game_masters.all()
    serializer = GameMasterSerializer(game_masters, many=True)
    return Response(serializer.data)


def _create_game_master(request, game):
    """Validate the request and create a new DM assignment for the game."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    if GameMaster.objects.filter(game=game, user=request.user).exists():
        return Response({'errors': {'detail': ['user is already a game master']}}, status=400)

    game_master = GameMaster.objects.create(game=game, user=request.user)
    serializer = GameMasterSerializer(game_master)
    return Response(serializer.data, status=201)
