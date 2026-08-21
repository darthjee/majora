"""View for the DM-only PC possession acquire-all endpoint (accepts hidden game possessions)."""

from ....._possession_shared import build_possession_acquire_all_view

game_pc_possession_acquire_all = build_possession_acquire_all_view(npc=False)
