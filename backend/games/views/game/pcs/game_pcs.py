"""View for listing a game's Player Characters (PCs)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view

from ....models import Game
from ....serializers import CharacterListSerializer
from ...common import paginated_list_response
from .._shared import _with_treasure_value


@api_view(['GET'])
def game_pcs(request, game_slug):
    """Return list of Player Characters (PCs) for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    pcs = game.characters.filter(npc=False)
    pcs = _with_treasure_value(pcs)
    return paginated_list_response(request, pcs, CharacterListSerializer)
