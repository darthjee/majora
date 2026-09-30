"""View for listing a game's common items."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from common.query_filters import filter_by_name

from ...models import Game
from ...serializers import GameCommonItemListSerializer
from ..common import paginated_list_response
from ._common_item_create import game_common_item_create


@api_view(['GET', 'POST'])
# AllowAny: GET is intentionally public; POST authorization is enforced inline via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_common_items(request, game_slug):
    """Return a paginated list of non-hidden common items for a game, or create a new one.

    GET accepts an optional ``name`` query param (case-insensitive substring match).
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_common_item_create(request, game)
    common_items = filter_by_name(request, game.common_items.filter(hidden=False))
    return paginated_list_response(request, common_items, GameCommonItemListSerializer)
