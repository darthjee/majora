"""View for the dm/admin-only NPC item quantity summary endpoint (includes hidden)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ......decorators import restricted
from ......models import Game
from ....items._item_summary import character_item_summary, check_item_summary_all_permission


@restricted
@api_view(['GET'])
@permission_classes([AllowAny])
def game_npc_item_summary_all(request, game_slug, item_id, character_id):
    """Return an NPC's item quantity, including hidden rows — dm/admin only.

    Permission is checked (dm/admin, no owner concept) before the NPC is resolved from
    `character_id`, so an unauthorized/unauthenticated caller cannot distinguish a
    nonexistent NPC from a hidden one via the response status.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_item_summary_all_permission(request, game, 'game_npc_item')
    if error_response:
        return error_response
    return character_item_summary(
        request, game, character_id, item_id, npc=True, check_hidden=True, count_hidden=True,
    )
