"""View for listing an NPC's items."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ......authentication import CookieTokenAuthentication
from ......models import Game
from ...._items import character_items


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: this is a read-only endpoint that returns a public list of non-hidden items for
# a given NPC; no user-specific data is exposed and there are no write operations. Hidden
# NPCs are still gated below via can_be_edited_by.
@permission_classes([AllowAny])
def game_npc_items(request, game_slug, character_id):
    """Return a paginated list of non-hidden items held by a specific NPC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_items(request, game, character_id, npc=True, check_hidden=True)
