"""View for listing a PC's items."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ......authentication import CookieTokenAuthentication
from ......models import Game
from ...._items import character_items


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: this is a read-only endpoint that returns a public list of non-hidden items for
# a given PC; no user-specific data is exposed and there are no write operations.
@permission_classes([AllowAny])
def game_pc_items(request, game_slug, character_id):
    """Return a paginated list of non-hidden items held by a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_items(request, game, character_id, npc=False, check_hidden=False)
