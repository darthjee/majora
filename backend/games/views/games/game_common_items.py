"""View for listing a game's common items."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...decorators import token_scopes
from ...models import Game
from ...serializers import GameCommonItemListSerializer
from ..common import paginated_list_response
from ._common_item_create import game_common_item_create
from ._common_item_filters import apply_common_item_filters


@token_scopes(GET=[], POST=['common_items:write'])
@api_view(['GET', 'POST'])
# AllowAny: GET is intentionally public; POST authorization is enforced inline via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_common_items(request, game_slug):
    """Return a paginated list of non-hidden common items for a game, or create a new one.

    GET accepts optional query params, combined with AND: ``name`` (case-insensitive substring),
    ``category`` (exact match), ``min_price`` and ``max_price`` (integer price bounds).
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_common_item_create(request, game)
    common_items = apply_common_item_filters(
        request, game.common_items.filter(hidden=False),
    )
    return paginated_list_response(request, common_items, GameCommonItemListSerializer)
