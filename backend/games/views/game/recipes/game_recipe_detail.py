"""View for retrieving a single non-hidden recipe in a game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ....models import Game
from ....serializers import GameRecipeDetailSerializer


@api_view(['GET'])
# AllowAny: GET is intentionally public; hidden recipes 404 and hidden output items are
# masked by the serializer.
@permission_classes([AllowAny])
def game_recipe_detail(request, game_slug, recipe_id):
    """Return detail for a single non-hidden recipe belonging to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    recipe = get_object_or_404(game.recipes.filter(hidden=False), id=recipe_id)
    return Response(GameRecipeDetailSerializer(recipe).data)
