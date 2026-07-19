"""View for the NPC treasure acquire endpoint."""

from ...._character_shared import build_treasure_acquire_view

game_npc_treasure_acquire = build_treasure_acquire_view(npc=True)
