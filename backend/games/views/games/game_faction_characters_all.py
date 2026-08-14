"""View for listing all characters (including hidden) belonging to a game faction."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ..common import check_game_edit
from ._faction_characters import faction_characters


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_faction_characters_all(request, game_slug, faction_id):
    """Return all characters (including hidden) belonging to a faction — DM/admin only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    faction = get_object_or_404(game.factions.all(), id=faction_id)
    response = faction_characters(request, game, faction, allow_hidden=True)
    response['X-Skip-Cache'] = 'true'
    return response
