"""Proxy cache paths of a target game made stale by a game-content copy.

Shared by the copy types (the copy `201`) and the copy-link registry (the link finalize), so
both send the same `X-Cache-Clear` paths, following the "Cache" section of each tab spec under
`docs/agents/specs/game-content-copy/`.
"""

from . import photo_types
from .photo_cache_paths import (
    FULL_FAMILY,
    GameCharactersAvailableCachePaths,
    GameResourceCachePaths,
)

_AVAILABLE_FACTIONS = GameCharactersAvailableCachePaths('factions')
_AVAILABLE_ITEMS = GameCharactersAvailableCachePaths('items')
_AVAILABLE_POSSESSIONS = GameCharactersAvailableCachePaths('possessions')
_FACTIONS = GameResourceCachePaths('factions')
_RECIPES = GameResourceCachePaths('recipes', **FULL_FAMILY)


def items_copy_cache_paths(item):
    """Return the item family of `item` plus every character's `items/available.json`."""
    family = photo_types.find('game_item').cache_paths(item)
    return family + _AVAILABLE_ITEMS.paths(item.game)


def common_items_copy_cache_paths(common_item):
    """Return the common item family of `common_item` (no `available.json`, no recipes)."""
    return photo_types.find('game_common_item').cache_paths(common_item)


def common_item_recipes_cache_paths(common_item):
    """Return the nested recipe lists of `common_item`: `recipes.json` and `recipes/all.json`."""
    base = f'/games/{common_item.game.game_slug}/common_items/{common_item.pk}/recipes'
    return [f'{base}.json', f'{base}/all.json']


def recipes_copy_cache_paths(recipe):
    """Return the recipe family of `recipe` plus its common item's nested recipe lists."""
    return _RECIPES.paths(recipe) + common_item_recipes_cache_paths(recipe.game_common_item)


def possessions_copy_cache_paths(possession):
    """Return the possession family of `possession` plus every character's available list."""
    family = photo_types.find('game_possession').cache_paths(possession)
    return family + _AVAILABLE_POSSESSIONS.paths(possession.game)


def factions_copy_cache_paths(faction):
    """Return the faction family of `faction` plus every character's `factions/available.json`."""
    return _FACTIONS.paths(faction) + _AVAILABLE_FACTIONS.paths(faction.game)
