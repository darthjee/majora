"""View for the PC items/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ......authentication import CookieTokenAuthentication
from ......models import Game
from ......permissions import CharacterEditPermission
from ......serializers import CharacterItemAllSerializer
from ...._items import character_items
from ...._shared import _get_character_or_404


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline via CharacterEditPermission.check(), which
# already covers the PC's owning player, a DM, or a superuser — so an unauthorized caller
# gets the app's own 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_pc_items_all(request, game_slug, character_id):
    """Return all items (including hidden) held by a PC — dm/owner/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=False)
    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response
    response = character_items(
        request, game, character_id, npc=False, check_hidden=False, allow_hidden=True,
        serializer_class=CharacterItemAllSerializer,
    )
    response['X-Skip-Cache'] = 'true'
    return response
