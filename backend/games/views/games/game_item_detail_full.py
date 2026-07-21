"""View for retrieving any item (including hidden) in a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import GameItemDetailFullSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# GameEditPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_item_detail_full(request, game_slug, item_id):
    """Return detail for any item (including hidden) in a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    item = get_object_or_404(game.items.all(), id=item_id)
    response = Response(GameItemDetailFullSerializer(item).data)
    response['X-Skip-Cache'] = 'true'
    return response
