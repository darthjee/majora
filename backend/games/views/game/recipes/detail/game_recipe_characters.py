"""View for listing the characters who know a non-hidden game recipe."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .....models import Game
from .._recipe_characters import recipe_characters


@api_view(['GET'])
@permission_classes([AllowAny])
def game_recipe_characters(request, game_slug, recipe_id):
    """Return a paginated list of the characters who know a recipe.

    Public — `404` if the recipe is hidden or unknown. Excludes hidden links and hidden or
    incognito NPCs. Sets no `X-Skip-Cache` header: its output is identical for every viewer.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    recipe = get_object_or_404(game.recipes.filter(hidden=False), id=recipe_id)
    return recipe_characters(request, recipe, allow_hidden=False)
