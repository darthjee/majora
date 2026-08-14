"""View for the PC faction acquire (enlist) endpoint."""

from ...._character_shared import build_faction_acquire_view

game_pc_faction_acquire = build_faction_acquire_view(npc=False)
