"""View for the PC treasure sell endpoint."""

from ...._character_shared import build_treasure_sell_view

game_pc_treasure_sell = build_treasure_sell_view(npc=False)
