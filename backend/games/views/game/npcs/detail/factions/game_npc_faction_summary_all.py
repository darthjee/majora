"""View for the dm/admin-only NPC faction membership summary endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ......decorators import restricted
from ......models import Game
from ....factions._faction_summary import (
    character_faction_summary,
    check_faction_summary_all_permission,
)


@restricted
@api_view(['GET'])
@permission_classes([AllowAny])
def game_npc_faction_summary_all(request, game_slug, faction_id, character_id):
    """Return an NPC's faction membership — dm/admin only.

    Permission is checked (dm/admin, no owner concept) before the NPC is resolved from
    `character_id`, so an unauthorized/unauthenticated caller cannot distinguish a
    nonexistent NPC from a hidden one via the response status.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_faction_summary_all_permission(request, game, 'game_npc_faction')
    if error_response:
        return error_response
    return character_faction_summary(
        request, game, character_id, faction_id, npc=True, check_hidden=True,
        allow_hidden=True,
    )
