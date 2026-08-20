"""View for the restricted PC item remove-all endpoint (dm/admin/owner; accepts hidden items)."""

from ...._item_shared import build_item_remove_all_view

game_pc_item_remove_all = build_item_remove_all_view(npc=False)
