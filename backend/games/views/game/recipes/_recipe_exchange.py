"""Shared implementation for the character recipe available/acquire/remove endpoints (#1459).

Modeled on `_document_exchange.py`, but permission checks live in the view builders
(`_character/recipes/_recipe_shared.py`) so the hidden-NPC gate provably runs first (E7) and
each endpoint picks its own tier. Every response returned here sets `X-Skip-Cache: true`.
"""

from rest_framework import serializers
from rest_framework.response import Response

from common.query_filters import filter_by_name

from ....models import CharacterRecipe, GameRecipe
from ....serializers import CharacterRecipeDetailSerializer, GameRecipeListSerializer
from ...common import paginated_list_response, validated_or_error
from .._character._decorators import check_hidden

FROM_ANOTHER_GAME = 'game_recipe_from_another_game'
ALREADY_KNOWN = 'game_recipe_already_known'


class _GameRecipeIdSerializer(serializers.Serializer):
    """Validate the `game_recipe_id` payload shared by the acquire and remove endpoints."""

    game_recipe_id = serializers.IntegerField()


def _skip_cache(response):
    """Mark `response` as never cacheable and return it."""
    response['X-Skip-Cache'] = 'true'
    return response


def _not_found():
    """Return an empty, never-cached `404` Response."""
    return _skip_cache(Response(status=404))


def _game_recipe_id_error(code, status):
    """Return a never-cached error Response keyed on `game_recipe_id`."""
    return _skip_cache(Response({'errors': {'game_recipe_id': [code]}}, status=status))


def _validated_game_recipe_id(request):
    """Return a `(game_recipe_id, error_response)` pair parsed from the request body."""
    serializer = _GameRecipeIdSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return None, _skip_cache(error_response)
    return serializer.validated_data['game_recipe_id'], None


def _available_recipes(request, game, character, allow_hidden):
    """Return `game`'s recipes `character` does not know yet, filtered by `?name=`.

    Recipes linked through any of the character's rows are excluded, hidden rows included (an
    accepted known limitation). Hidden `GameRecipe`s are excluded unless `allow_hidden`.
    """
    known_ids = character.character_recipes.values_list('game_recipe_id', flat=True)
    recipes = game.recipes.exclude(id__in=known_ids).select_related('game_common_item__photo')
    if not allow_hidden:
        recipes = recipes.exclude(hidden=True)
    return filter_by_name(request, recipes, field='name').order_by('id')


def _find_game_recipe(game, game_recipe_id, allow_hidden):
    """Return a `(game_recipe, error_response)` pair for the submitted id.

    A recipe from another game is a `400`, checked before (and regardless of) its `hidden`;
    an unknown recipe, or a hidden one unless `allow_hidden`, is a `404`.
    """
    game_recipe = GameRecipe.objects.filter(id=game_recipe_id).first()
    if game_recipe is not None and game_recipe.game_id != game.id:
        return None, _game_recipe_id_error(FROM_ANOTHER_GAME, status=400)
    if game_recipe is None or (game_recipe.hidden and not allow_hidden):
        return None, _not_found()
    return game_recipe, None


def _create_character_recipe(character, game_recipe):
    """Return a new `CharacterRecipe` copying `GameRecipe.hidden`, or None if already known."""
    character_recipe, created = CharacterRecipe.objects.get_or_create(
        character=character, game_recipe=game_recipe,
        defaults={'hidden': game_recipe.hidden},
    )
    return character_recipe if created else None


@check_hidden
def character_recipes_available(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=GameRecipeListSerializer,
):
    """Return a paginated catalog of `game`'s recipes that `character` does not know yet."""
    recipes = _available_recipes(request, game, character, allow_hidden)
    return _skip_cache(paginated_list_response(request, recipes, serializer_class))


@check_hidden
def character_recipe_acquire(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=CharacterRecipeDetailSerializer, mask_hidden_output=True,
):
    """Link `character` to a submitted GameRecipe, returning `201` with `serializer_class`.

    Errors, in order: `400` (invalid id or recipe from another game), `404` (unknown, or hidden
    unless `allow_hidden`), `422` (already known, E4).
    """
    game_recipe_id, error_response = _validated_game_recipe_id(request)
    if error_response:
        return error_response
    game_recipe, error_response = _find_game_recipe(game, game_recipe_id, allow_hidden)
    if error_response:
        return error_response
    character_recipe = _create_character_recipe(character, game_recipe)
    if character_recipe is None:
        return _game_recipe_id_error(ALREADY_KNOWN, status=422)
    context = {'mask_hidden_output': mask_hidden_output}
    data = serializer_class(character_recipe, context=context).data
    return _skip_cache(Response(data, status=201))


@check_hidden
def character_recipe_remove(request, game, character, check_hidden, allow_hidden=False):
    """Delete `character`'s link to a submitted GameRecipe, never touching the GameRecipe.

    Returns `404` if the character does not know it (E8), or knows it only through a hidden row
    unless `allow_hidden` (E6).
    """
    game_recipe_id, error_response = _validated_game_recipe_id(request)
    if error_response:
        return error_response
    character_recipe = character.character_recipes.filter(game_recipe_id=game_recipe_id).first()
    if character_recipe is None or (character_recipe.hidden and not allow_hidden):
        return _not_found()
    character_recipe.delete()
    return _skip_cache(Response(status=204))
