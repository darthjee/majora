"""View for retrieving a single possession held by an NPC."""

from ...._character_shared import build_possession_detail_view

game_npc_possession_detail = build_possession_detail_view(npc=True)
