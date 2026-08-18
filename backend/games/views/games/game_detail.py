"""View for retrieving or updating a single game's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GameDetailSerializer, GameUpdateSerializer
from ..common import check_game_edit, detail_or_update
from ._shared import game_update


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def game_detail(request, game_slug):
    """Return detail for a game (GET), or update it (PATCH, dispatched by editor tier)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return game_update(request, game)
    return detail_or_update(
        request, game, check_game_edit, GameUpdateSerializer, GameDetailSerializer
    )
