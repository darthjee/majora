"""View for the NPC treasure remove endpoint."""

from ...._character_shared import build_treasure_remove_view

game_npc_treasure_remove = build_treasure_remove_view(npc=True)
