"""View for the restricted NPC faction remove-all endpoint (dm/admin/owner; accepts hidden)."""

from ....._faction_shared import build_faction_remove_all_view

game_npc_faction_remove_all = build_faction_remove_all_view(npc=True)
