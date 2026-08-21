"""View for listing, or creating, an NPC's possessions."""

from ...._character.possessions._possession_shared import build_possessions_view

game_npc_possessions = build_possessions_view(npc=True)
