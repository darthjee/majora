# Plan: Add CharacterRecipe available/acquire/remove endpoints and can_exchange_recipe flag

Issue: [1459-add-characterrecipe-available-acquire-remove-endpoints-and-can-exchange-recipe-flag.md](../../issues/1459-add-characterrecipe-available-acquire-remove-endpoints-and-can-exchange-recipe-flag.md)

## Overview

Add the PC/NPC `recipes/available(.json|/all.json)`, `recipes/acquire(.json|/all.json)` and
`recipes/remove(.json|/all.json)` endpoints, the `game_pc_recipe` / `game_npc_recipe`
permission configs, and the `can_exchange_recipe` flag on `/permissions/game_pc.json` /
`game_npc.json`. Backend only. The work mirrors `CharacterDocument`'s exchange flow, reusing
the `CharacterRecipe` serializers and output masking from #1447.

See [backend.md](backend.md) for the full plan.
