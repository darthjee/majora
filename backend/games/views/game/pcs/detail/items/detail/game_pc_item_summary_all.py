"""View for the dm/admin/owner-only PC item quantity summary endpoint (includes hidden)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .......decorators import restricted
from .......models import Game
from ....._shared import _get_character_or_404
from .....items._item_summary import character_item_summary, check_item_summary_all_permission


@restricted
@api_view(['GET'])
@permission_classes([AllowAny])
def game_pc_item_summary_all(request, game_slug, item_id, character_id):
    """Return a PC's item quantity, including hidden rows — dm/admin/owner only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=False)
    error_response = check_item_summary_all_permission(request, game, 'game_pc_item', character)
    if error_response:
        return error_response
    return character_item_summary(
        request, game, character_id, item_id, npc=False, check_hidden=False, count_hidden=True,
    )
