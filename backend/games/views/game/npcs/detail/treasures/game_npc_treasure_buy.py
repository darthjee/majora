"""View for the NPC treasure buy endpoint."""

from ...._character_shared import build_treasure_buy_view

game_npc_treasure_buy = build_treasure_buy_view(npc=True)
