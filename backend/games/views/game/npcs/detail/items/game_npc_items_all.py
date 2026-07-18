"""View for listing all items (including hidden) held by an NPC — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ......authentication import CookieTokenAuthentication
from ......models import Game
from ......permissions import GameEditPermission
from ......serializers import CharacterItemAllSerializer
from ...._items import character_items


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# GameEditPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_npc_items_all(request, game_slug, character_id):
    """Return all items (including hidden) held by an NPC — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    response = character_items(
        request, game, character_id, npc=True, check_hidden=True, allow_hidden=True,
        serializer_class=CharacterItemAllSerializer,
    )
    response['X-Skip-Cache'] = 'true'
    return response
