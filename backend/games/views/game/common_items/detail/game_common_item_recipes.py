"""View for listing the non-hidden recipes that produce a visible common item."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .....models import Game
from .....serializers import GameRecipeListSerializer
from ....common import paginated_list_response


@api_view(['GET'])
# AllowAny: GET is intentionally public; a hidden common item 404s and hidden recipes are
# excluded.
@permission_classes([AllowAny])
def game_common_item_recipes(request, game_slug, common_item_id):
    """Return a paginated list of the non-hidden recipes producing a visible common item."""
    game = get_object_or_404(Game, game_slug=game_slug)
    common_item = get_object_or_404(game.common_items.filter(hidden=False), id=common_item_id)
    recipes = common_item.recipes.filter(hidden=False).select_related('game_common_item__photo')
    return paginated_list_response(request, recipes, GameRecipeListSerializer)
