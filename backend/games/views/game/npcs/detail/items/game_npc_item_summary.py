"""View for the NPC item quantity summary endpoint — open to everyone."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ......decorators import regular, skip_cache
from ......models import Game
from ...._item_summary import character_item_summary


@regular
@skip_cache
@api_view(['GET'])
@permission_classes([AllowAny])
def game_npc_item_summary(request, game_slug, item_id, character_id):
    """Return how many of a GameItem a specific NPC owns, as {'quantity': <int>}."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_item_summary(
        request, game, character_id, item_id, npc=True, check_hidden=True, count_hidden=False,
    )
