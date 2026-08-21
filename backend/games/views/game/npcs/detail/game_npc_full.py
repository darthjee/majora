"""View for the full (private-description-included) NPC detail endpoint."""

from ..._character import build_full_view

game_npc_full = build_full_view(npc=True)
