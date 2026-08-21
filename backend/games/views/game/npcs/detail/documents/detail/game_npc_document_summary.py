"""View for the NPC document ownership summary endpoint — open to everyone."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .......decorators import regular, skip_cache
from .......models import Game
from .....documents._document_summary import character_document_summary


@regular
@skip_cache
@api_view(['GET'])
@permission_classes([AllowAny])
def game_npc_document_summary(request, game_slug, document_id, character_id):
    """Return whether a specific NPC owns a Document, as {'owned': <bool>}."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_document_summary(
        request, game, character_id, document_id, npc=True, check_hidden=True,
        allow_hidden=False,
    )
