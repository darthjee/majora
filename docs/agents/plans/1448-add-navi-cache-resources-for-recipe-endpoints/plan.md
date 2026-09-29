# Plan: Add Navi cache resources for recipe endpoints

Issue: [1448-add-navi-cache-resources-for-recipe-endpoints.md](../../issues/1448-add-navi-cache-resources-for-recipe-endpoints.md)

## Overview
Add Navi warm-up resources for every plain (`AllowAny`) recipe GET endpoint introduced by #1441
(game recipes, recipe characters, common item recipes, PC/NPC recipes, `/permissions/game_recipe.json`),
chained from their parent resources, plus a read-only `X-Skip-Cache` review of the restricted variants.
Only the `cache` agent has work.

See [cache.md](cache.md) for the full plan.
