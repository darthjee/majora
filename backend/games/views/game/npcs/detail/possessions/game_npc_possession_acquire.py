"""View for the NPC possession acquire endpoint."""

from ...._possession_shared import build_possession_acquire_view

game_npc_possession_acquire = build_possession_acquire_view(npc=True)
