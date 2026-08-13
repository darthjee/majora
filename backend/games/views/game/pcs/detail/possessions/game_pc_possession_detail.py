"""View for retrieving a single possession held by a PC."""

from ...._character_shared import build_possession_detail_view

game_pc_possession_detail = build_possession_detail_view(npc=False)
