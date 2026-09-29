"""View for the NPC recipe acquire/all.json endpoint (GameEdit)."""

from ....._character.recipes._recipe_shared import build_recipe_acquire_all_view

game_npc_recipe_acquire_all = build_recipe_acquire_all_view(npc=True)
