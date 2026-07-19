"""View for the NPC treasure sell endpoint."""

from ...._character_shared import build_treasure_sell_view

game_npc_treasure_sell = build_treasure_sell_view(npc=True)
