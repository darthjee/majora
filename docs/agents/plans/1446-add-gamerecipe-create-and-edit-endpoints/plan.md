# Plan: Add GameRecipe create and edit endpoints

Issue: [1446-add-gamerecipe-create-and-edit-endpoints.md](../../issues/1446-add-gamerecipe-create-and-edit-endpoints.md)

## Overview

Add `POST /games/<slug>/recipes.json` and `PATCH /games/<slug>/recipes/<id>.json` for
`GameRecipe`. They are gated by a new `game_recipe/endpoints.yml`, use an explicit-allowlist write
serializer with hidden-aware `game_common_item_id` validation, and return a response shape that
depends on the caller's tier. The plan also adds the `can_create_recipe` flag and the
`/permissions/game_recipe.json` endpoint. Backend only.

See [backend.md](backend.md) for the full plan.
