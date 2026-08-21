"""View for the dm/admin/owner-only PC document ownership summary endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .......decorators import restricted
from .......models import Game
from ....._character._shared import _get_character_or_404
from .....documents._document_summary import (
    character_document_summary,
    check_document_summary_all_permission,
)


@restricted
@api_view(['GET'])
@permission_classes([AllowAny])
def game_pc_document_summary_all(request, game_slug, document_id, character_id):
    """Return a PC's document ownership — dm/admin/owner only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=False)
    error_response = check_document_summary_all_permission(
        request, game, 'game_pc_document', character,
    )
    if error_response:
        return error_response
    return character_document_summary(
        request, game, character_id, document_id, npc=False, check_hidden=False,
        allow_hidden=True,
    )
