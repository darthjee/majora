# Plan: Add CharacterRecipe model and endpoints (link recipes to PCs/NPCs)

Issue: [1447-add-characterrecipe-model-and-endpoints-link-recipes-to-pcs-npcs.md](../../issues/1447-add-characterrecipe-model-and-endpoints-link-recipes-to-pcs-npcs.md)

## Overview

Add the `CharacterRecipe` join model plus its PC/NPC read endpoints (index, `all`, detail,
`full`), the `hidden`-only PATCH, and the `recipes/<id>/characters.json` listing. This is
backend-only. The available / acquire / remove flow and `can_exchange_recipe` are in #1459.

See [backend.md](backend.md) for the full plan.
