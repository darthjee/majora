"""View for the NPC recipe remove endpoint (regular.create)."""

from ....._character.recipes._recipe_shared import build_recipe_remove_view

game_npc_recipe_remove = build_recipe_remove_view(npc=True)
