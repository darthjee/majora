"""View for the NPC faction membership summary endpoint — open to everyone."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ......decorators import regular, skip_cache
from ......models import Game
from ....factions._faction_summary import character_faction_summary


@regular
@skip_cache
@api_view(['GET'])
@permission_classes([AllowAny])
def game_npc_faction_summary(request, game_slug, faction_id, character_id):
    """Return whether a specific NPC belongs to a GameFaction, as {'enlisted': <bool>}."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_faction_summary(
        request, game, character_id, faction_id, npc=True, check_hidden=True,
        allow_hidden=False,
    )
