"""View for listing a game's visible Non-Player Characters (NPCs)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view

from ...models import Game
from ...serializers import CharacterListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
def game_npcs(request, game_slug):
    """Return list of Non-Player Characters (NPCs) for a specific game (hidden excluded)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    npcs = game.characters.filter(npc=True, hidden=False)
    return paginated_list_response(request, npcs, CharacterListSerializer)
