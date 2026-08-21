"""View for the DM-only NPC faction acquire-all endpoint (bypasses hidden-character gate)."""

from ....._character.factions._faction_shared import build_faction_acquire_all_view

game_npc_faction_acquire_all = build_faction_acquire_all_view(npc=True)
