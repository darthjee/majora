"""View for listing a game's factions."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import FactionListSerializer
from ..common import paginated_list_response
from ._faction_create import faction_create


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_factions(request, game_slug):
    """Return a paginated list of a game's factions, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return faction_create(request, game)
    return paginated_list_response(request, game.factions.all(), FactionListSerializer)
