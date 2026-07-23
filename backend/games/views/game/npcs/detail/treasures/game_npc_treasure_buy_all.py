"""View for the DM-only NPC treasure buy-all endpoint (accepts hidden treasures)."""

from ...._character_shared import build_treasure_buy_all_view

game_npc_treasure_buy_all = build_treasure_buy_all_view(npc=True)
