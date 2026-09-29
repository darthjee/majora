"""View for the NPC recipe remove/all.json endpoint (GameEdit)."""

from ....._character.recipes._recipe_shared import build_recipe_remove_all_view

game_npc_recipe_remove_all = build_recipe_remove_all_view(npc=True)
