"""View for listing all treasures (including hidden) held by an NPC — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ......models import Game
from ......serializers import CharacterTreasureAllSerializer
from .....common import check_game_edit
from ....treasures._treasures import character_treasures


@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# check_game_edit(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_npc_treasures_all(request, game_slug, character_id):
    """Return all treasures (including hidden) held by an NPC — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    response = character_treasures(
        request, game, character_id, npc=True, check_hidden=True, allow_hidden=True,
        serializer_class=CharacterTreasureAllSerializer,
    )
    response['X-Skip-Cache'] = 'true'
    return response
