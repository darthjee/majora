"""View for the NPC faction remove (quit) endpoint."""

from ...._faction_shared import build_faction_remove_view

game_npc_faction_remove = build_faction_remove_view(npc=True)
