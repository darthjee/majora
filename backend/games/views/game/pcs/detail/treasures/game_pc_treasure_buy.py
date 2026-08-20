"""View for the PC treasure buy endpoint."""

from ...._treasure_shared import build_treasure_buy_view

game_pc_treasure_buy = build_treasure_buy_view(npc=False)
