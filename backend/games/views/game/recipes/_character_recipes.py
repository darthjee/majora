"""Shared implementation for the character recipe index and detail endpoints (issue #1447)."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from common.query_filters import filter_by_name

from ....serializers import (
    CharacterRecipeDetailFullSerializer,
    CharacterRecipeDetailSerializer,
    CharacterRecipeSerializer,
    CharacterRecipeUpdateSerializer,
)
from ...common import paginated_list_response, validated_or_error
from .._character._decorators import check_hidden


def _character_recipe_rows(character, allow_hidden):
    """Return `character`'s recipe rows, excluding hidden ones unless `allow_hidden`.

    Only `CharacterRecipe.hidden` is considered: `GameRecipe.hidden` is ignored on character
    endpoints (E9).
    """
    rows = character.character_recipes.select_related(
        'game_recipe', 'game_recipe__game_common_item__photo',
    )
    return rows if allow_hidden else rows.exclude(hidden=True)


def _mask_context(mask_hidden_output):
    """Return the serializer context carrying the caller-dependent output mask."""
    return {'mask_hidden_output': mask_hidden_output}


def _mark_hidden_character(response, character, check_hidden):
    """Set `X-Skip-Cache` when a hidden NPC is served through the hidden-NPC gate."""
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_recipes(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=CharacterRecipeSerializer, mask_hidden_output=True,
):
    """Return a paginated list of recipes known by a specific character in a game.

    Supports `?name=` (case-insensitive substring on the linked `GameRecipe.name`).
    `mask_hidden_output` is decided by the calling view from the caller's tier.
    """
    rows = _character_recipe_rows(character, allow_hidden)
    rows = filter_by_name(request, rows, field='game_recipe__name')
    response = paginated_list_response(
        request, rows, serializer_class, context=_mask_context(mask_hidden_output),
    )
    return _mark_hidden_character(response, character, check_hidden)


@check_hidden
def character_recipe_detail(
    request, game, character, character_recipe_id, check_hidden, allow_hidden=False,
    serializer_class=CharacterRecipeDetailSerializer, mask_hidden_output=True,
):
    """Return detail for a single recipe row of a specific character in a game.

    The row is looked up among that character's own rows only, so another character's id
    returns `404`, as does a hidden row unless `allow_hidden`.
    """
    rows = _character_recipe_rows(character, allow_hidden)
    character_recipe = get_object_or_404(rows, id=character_recipe_id)
    data = serializer_class(character_recipe, context=_mask_context(mask_hidden_output)).data
    return _mark_hidden_character(Response(data), character, check_hidden)


def character_recipe_update(request, character, character_recipe_id, mask_hidden_output):
    """Update the `hidden` flag of one of `character`'s recipe rows (hidden ones included).

    Only `hidden` is written; every other field is ignored. The caller has already run the
    hidden-NPC gate and the permission check, so a non-editor never observes whether
    `character_recipe_id` exists. Responds with the `/full.json` shape.
    """
    character_recipe = get_object_or_404(
        _character_recipe_rows(character, allow_hidden=True), id=character_recipe_id,
    )
    serializer = CharacterRecipeUpdateSerializer(character_recipe, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response
    serializer.save()
    context = _mask_context(mask_hidden_output)
    return Response(CharacterRecipeDetailFullSerializer(character_recipe, context=context).data)
