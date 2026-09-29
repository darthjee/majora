"""View for listing every character who knows a game recipe — GameEdit only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .....models import Game
from ....common import check_game_edit
from .._recipe_characters import recipe_characters


@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_recipe_characters_all(request, game_slug, recipe_id):
    """Return every character who knows a recipe (hidden recipe, links and NPCs included)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    recipe = get_object_or_404(game.recipes.all(), id=recipe_id)
    response = recipe_characters(request, recipe, allow_hidden=True)
    response['X-Skip-Cache'] = 'true'
    return response
