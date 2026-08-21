"""View for retrieving a single faction membership held by a NPC."""

from ....._character.factions._faction_shared import build_faction_detail_view

game_npc_faction_detail = build_faction_detail_view(npc=True)
