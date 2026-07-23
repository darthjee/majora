"""View for the DM-only PC treasure buy-all endpoint (accepts hidden treasures)."""

from ...._character_shared import build_treasure_buy_all_view

game_pc_treasure_buy_all = build_treasure_buy_all_view(npc=False)
