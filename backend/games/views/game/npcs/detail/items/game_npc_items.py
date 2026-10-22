"""View for listing an NPC's items."""

from ......decorators import token_scopes
from ...._character.items._item_shared import build_items_view

game_npc_items = token_scopes(GET=[], POST=['npcs:write', 'items:write'])(
    build_items_view(npc=True),
)
