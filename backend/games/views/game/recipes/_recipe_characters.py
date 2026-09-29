"""Shared implementation for the recipe → characters endpoints (issue #1447)."""

from ....serializers import GameRecipeCharacterAllSerializer, GameRecipeCharacterSerializer
from ...common import paginated_list_response


def _visible_rows(rows):
    """Exclude hidden links and hidden or incognito NPCs from `rows`."""
    rows = rows.filter(hidden=False)
    rows = rows.exclude(character__npc=True, character__hidden=True)
    return rows.exclude(character__npc=True, character__incognito=True)


def recipe_characters(request, recipe, allow_hidden):
    """Return a paginated list of the characters (PCs and NPCs) who know `recipe`.

    Lists `CharacterRecipe` rows (serialized as their character), ordered by character name,
    then id. Unless `allow_hidden` (the GameEdit `/characters/all.json` variant), hidden links
    and hidden or incognito NPCs are excluded, and entries carry no `hidden` flag.
    """
    rows = recipe.character_recipes.select_related('character__photo').order_by(
        'character__name', 'character__id',
    )
    if allow_hidden:
        return paginated_list_response(request, rows, GameRecipeCharacterAllSerializer)
    return paginated_list_response(request, _visible_rows(rows), GameRecipeCharacterSerializer)
