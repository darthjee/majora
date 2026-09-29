"""View for retrieving any recipe (including hidden) known by a NPC (restricted)."""

from ....._character.recipes._recipe_shared import build_recipe_detail_full_view

game_npc_recipe_detail_full = build_recipe_detail_full_view(npc=True)
