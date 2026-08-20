"""View for the restricted PC possession remove-all endpoint (dm/admin/owner; accepts hidden)."""

from ...._possession_shared import build_possession_remove_all_view

game_pc_possession_remove_all = build_possession_remove_all_view(npc=False)
