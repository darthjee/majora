"""View for the restricted PC faction remove-all endpoint (dm/admin/owner; accepts hidden)."""

from ...._faction_shared import build_faction_remove_all_view

game_pc_faction_remove_all = build_faction_remove_all_view(npc=False)
