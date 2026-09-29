"""View for retrieving a single recipe known by a NPC."""

from ....._character.recipes._recipe_shared import build_recipe_detail_view

game_npc_recipe_detail = build_recipe_detail_view(npc=True)
