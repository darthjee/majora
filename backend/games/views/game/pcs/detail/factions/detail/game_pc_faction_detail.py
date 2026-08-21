"""View for retrieving a single faction membership held by a PC."""

from ....._character.factions._faction_shared import build_faction_detail_view

game_pc_faction_detail = build_faction_detail_view(npc=False)
