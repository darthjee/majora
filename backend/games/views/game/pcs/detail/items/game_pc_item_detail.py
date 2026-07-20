"""View for retrieving a single non-hidden item held by a PC."""

from ...._character_shared import build_item_detail_view

game_pc_item_detail = build_item_detail_view(npc=False)
