"""View for the DM-only PC faction acquire-all endpoint (bypasses hidden-character gate)."""

from ....._faction_shared import build_faction_acquire_all_view

game_pc_faction_acquire_all = build_faction_acquire_all_view(npc=False)
