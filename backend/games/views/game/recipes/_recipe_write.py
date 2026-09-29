"""Implementation for the game recipe create/update endpoints (issue #1446)."""

from rest_framework.response import Response

from permissions import EndpointPermission

from ....decorators import skip_cache
from ....models import Game
from ....serializers import (
    GameRecipeDetailFullSerializer,
    GameRecipeDetailSerializer,
    GameRecipeWriteSerializer,
)
from ...common import validated_or_error


def _response_serializer(is_game_edit):
    """Return the recipe serializer matching the caller's read tier (E2)."""
    if is_game_edit:
        return GameRecipeDetailFullSerializer
    return GameRecipeDetailSerializer


def _check_permission(request, game, action):
    """Return a 401/403 Response if `request.user` may not `action` recipes of `game`."""
    return EndpointPermission(request.user, game=game).check(
        request, 'game_recipe', 'regular', action,
    )


def _find_recipe(game, recipe_id, is_game_edit):
    """Return the recipe `recipe_id` of `game` visible to the caller's tier, or None (E3)."""
    recipes = game.recipes.all() if is_game_edit else game.recipes.filter(hidden=False)
    return recipes.filter(id=recipe_id).first()


def _save_response(serializer, is_game_edit, status, **save_kwargs):
    """Validate and save `serializer`, returning the tier-shaped recipe or a 400 Response."""
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response
    recipe = serializer.save(**save_kwargs)
    return Response(_response_serializer(is_game_edit)(recipe).data, status=status)


def _write_context(game, is_game_edit):
    """Return the write serializer context for `game` and the caller's tier (E1)."""
    return {'game': game, 'allow_hidden_output': is_game_edit}


def _find_game(game_slug):
    """Return the game identified by `game_slug`, or None."""
    return Game.objects.filter(game_slug=game_slug).first()


@skip_cache
def game_recipe_create(request, game_slug):
    """Create a new GameRecipe for the game `game_slug` (404 if the game is unknown)."""
    game = _find_game(game_slug)
    if game is None:
        return Response(status=404)
    return _create_recipe(request, game)


@skip_cache
def game_recipe_update(request, game_slug, recipe_id):
    """Partially update the GameRecipe `recipe_id` of the game `game_slug`."""
    game = _find_game(game_slug)
    if game is None:
        return Response(status=404)
    return _update_recipe(request, game, recipe_id)


def _create_recipe(request, game):
    """Create a new GameRecipe for `game`."""
    error_response = _check_permission(request, game, 'create')
    if error_response:
        return error_response
    is_game_edit = game.can_be_edited_by(request.user)
    serializer = GameRecipeWriteSerializer(
        data=request.data, context=_write_context(game, is_game_edit),
    )
    return _save_response(serializer, is_game_edit, 201, game=game)


def _update_recipe(request, game, recipe_id):
    """Partially update the GameRecipe `recipe_id` of `game`."""
    error_response = _check_permission(request, game, 'edit')
    if error_response:
        return error_response
    is_game_edit = game.can_be_edited_by(request.user)
    recipe = _find_recipe(game, recipe_id, is_game_edit)
    if recipe is None:
        return Response(status=404)
    serializer = GameRecipeWriteSerializer(
        recipe, data=request.data, partial=True, context=_write_context(game, is_game_edit),
    )
    return _save_response(serializer, is_game_edit, 200)
