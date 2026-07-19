"""View for the full (private-description-included) PC detail endpoint."""

from ..._character_shared import build_full_view

game_pc_full = build_full_view(npc=False)
