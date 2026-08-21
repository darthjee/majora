"""View for the DM-only NPC possession remove-all endpoint (accepts hidden possessions)."""

from ....._character.possessions._possession_shared import build_possession_remove_all_view

game_npc_possession_remove_all = build_possession_remove_all_view(npc=True)
