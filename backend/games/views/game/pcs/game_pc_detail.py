"""View for retrieving or updating a single PC's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ....models import Game
from .._character._detail import character_detail
from .._character._regular import character_regular_update
from .._character._shared import _get_character_or_404


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def game_pc_detail(request, game_slug, character_id):
    """Return, or update the player-writable field set for, a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        character = _get_character_or_404(game, character_id, npc=False)
        return character_regular_update(request, character)
    return character_detail(request, game, character_id, npc=False, check_hidden=False)
