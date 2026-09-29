"""View for listing, or creating, a game's recipes."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ....models import Game
from ....serializers import GameRecipeListSerializer
from ...common import paginated_list_response
from ._recipe_filters import filter_by_category
from ._recipe_write import game_recipe_create


@api_view(['GET', 'POST'])
# AllowAny: GET is intentionally public; hidden recipes are excluded and hidden output items
# are masked by the serializer. POST authorization is enforced inline via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_recipes(request, game_slug):
    """Return a paginated list of non-hidden recipes for a game, or create a new recipe."""
    if request.method == 'POST':
        return game_recipe_create(request, game_slug)
    game = get_object_or_404(Game, game_slug=game_slug)
    recipes = game.recipes.filter(hidden=False).select_related('game_common_item__photo')
    recipes = filter_by_category(request, recipes, mask_hidden_output=True)
    return paginated_list_response(request, recipes, GameRecipeListSerializer)
