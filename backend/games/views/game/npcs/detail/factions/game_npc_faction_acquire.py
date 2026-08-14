"""View for the NPC faction acquire (enlist) endpoint."""

from ...._character_shared import build_faction_acquire_view

game_npc_faction_acquire = build_faction_acquire_view(npc=True)
