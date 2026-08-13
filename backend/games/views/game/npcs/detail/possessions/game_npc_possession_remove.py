"""View for the NPC possession remove endpoint."""

from ...._character_shared import build_possession_remove_view

game_npc_possession_remove = build_possession_remove_view(npc=True)
