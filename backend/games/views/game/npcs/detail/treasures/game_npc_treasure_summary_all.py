"""View for the dm/admin-only NPC treasure quantity summary endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ......decorators import restricted
from ......models import Game
from ...._treasure_summary import character_treasure_summary, check_treasure_summary_all_permission


@restricted
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_treasure_summary_all(request, game_slug, treasure_id, character_id):
    """Return an NPC's treasure quantity — dm/admin only.

    Permission is checked (dm/admin, no owner concept) before the NPC is resolved from
    `character_id`, so an unauthorized/unauthenticated caller cannot distinguish a
    nonexistent NPC from a hidden one via the response status.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_treasure_summary_all_permission(request, game, 'game_npc_treasure')
    if error_response:
        return error_response
    return character_treasure_summary(
        request, game, character_id, treasure_id, npc=True, check_hidden=True,
        allow_hidden=True,
    )
