"""Proxy cache paths of a target game made stale by a game-content copy.

Shared by the copy types (the copy `201`) and the copy-link registry (the link finalize), so
both send the same `X-Cache-Clear` paths, following the "Cache" section of each tab spec under
`docs/agents/specs/game-content-copy/`.
"""

from . import photo_types
from .photo_cache_paths import GameCharactersAvailableCachePaths

_AVAILABLE_ITEMS = GameCharactersAvailableCachePaths('items')


def items_copy_cache_paths(item):
    """Return the item family of `item` plus every character's `items/available.json`."""
    family = photo_types.find('game_item').cache_paths(item)
    return family + _AVAILABLE_ITEMS.paths(item.game)
