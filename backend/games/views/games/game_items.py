"""View for listing a game's items."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameItemListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; hidden items are excluded below.
@permission_classes([AllowAny])
def game_items(request, game_slug):
    """Return a paginated list of non-hidden items for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    items = game.items.filter(hidden=False)
    return paginated_list_response(request, items, GameItemListSerializer)
