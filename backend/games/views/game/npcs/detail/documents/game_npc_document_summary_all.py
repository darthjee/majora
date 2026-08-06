"""View for the dm/admin-only NPC document ownership summary endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ......decorators import restricted
from ......models import Game
from ...._document_summary import character_document_summary, check_document_summary_all_permission


@restricted
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_document_summary_all(request, game_slug, document_id, character_id):
    """Return an NPC's document ownership — dm/admin only.

    Permission is checked (dm/admin, no owner concept) before the NPC is resolved from
    `character_id`, so an unauthorized/unauthenticated caller cannot distinguish a
    nonexistent NPC from a hidden one via the response status.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_document_summary_all_permission(request, game, 'game_npc_document')
    if error_response:
        return error_response
    return character_document_summary(
        request, game, character_id, document_id, npc=True, check_hidden=True,
        allow_hidden=True,
    )
