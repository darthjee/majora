"""View for the dm/admin-only NPC item quantity summary endpoint (includes hidden)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ......decorators import restricted
from ......models import Game
from ...._item_summary import character_item_summary, check_item_summary_all_permission
from ...._shared import _get_character_or_404


@restricted
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_item_summary_all(request, game_slug, item_id, character_id):
    """Return an NPC's item quantity, including hidden rows — dm/admin only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=True)
    error_response = check_item_summary_all_permission(request, game, character)
    if error_response:
        return error_response
    return character_item_summary(
        request, game, character_id, item_id, npc=True, check_hidden=True, count_hidden=True,
    )
