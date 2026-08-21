"""View for listing a PC's items."""

from ...._character.items._item_shared import build_items_view

game_pc_items = build_items_view(npc=False)
