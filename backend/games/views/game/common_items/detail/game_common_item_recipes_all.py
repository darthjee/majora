"""View for listing all recipes (including hidden) producing a common item — GameEdit only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .....models import Game
from .....serializers import GameRecipeAllListSerializer
from ....common import check_game_edit, paginated_list_response


@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_common_item_recipes_all(request, game_slug, common_item_id):
    """Return all recipes (including hidden) producing any common item of a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    common_item = get_object_or_404(game.common_items.all(), id=common_item_id)
    recipes = common_item.recipes.select_related('game_common_item__photo')
    response = paginated_list_response(request, recipes, GameRecipeAllListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
