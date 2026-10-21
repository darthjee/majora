"""View for listing a PC's items."""

from ......decorators import token_scopes
from ...._character.items._item_shared import build_items_view

game_pc_items = token_scopes(GET=[], POST=['pcs:write', 'items:write'])(
    build_items_view(npc=False),
)
