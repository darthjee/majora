"""View for listing all treasures (including hidden) in a game — DM/superuser only."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game, Treasure
from ...permissions import GameEditPermission
from ...serializers import TreasureListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# GameEditPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_treasures_all(request, game_slug):
    """Return all treasures (including hidden) for a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    treasures = Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()
    response = paginated_list_response(request, treasures, TreasureListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
