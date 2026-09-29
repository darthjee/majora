# Backend Plan: Add CharacterRecipe model and endpoints (link recipes to PCs/NPCs)

Main plan: [plan.md](plan.md)

## Overview

Add `CharacterRecipe`, the thin join recording that a PC or NPC knows a `GameRecipe`. Expose it
through the same view-factory pattern that `CharacterPossession` uses (`build_possession*_view`
in `backend/games/views/game/_character/possessions/_possession_shared.py`). Add a `hidden`-only
PATCH modeled on the `CharacterItem` detail view, and add recipe → characters modeled on
`/games/<slug>/factions/<id>/characters.json`.

## Context

- The binding contract is `docs/agents/specs/recipes/api-contract.md`, in the sections
  "Recipe → characters" and "Character recipes → Index and detail / Toggling hidden (PATCH)".
  Also read `character-recipe.md`, `visibility.md` and `deletion.md` in the same folder.
- `GameRecipe` and its serializers already exist
  (`backend/games/serializers/games/recipes/game_recipe_list.py`). `mask_hidden_output` drives
  output masking as a class attribute.
- Out of scope, and must not be added here: `available*`, `acquire*`, `remove*`, the
  `game_pc_recipe` / `game_npc_recipe` `endpoints.yml` files, and `can_exchange_recipe`.
  These belong to #1459. Navi and frontend are also out of scope.

## Steps

- [01 — Add the CharacterRecipe model](backend/01-add-character-recipe-model.md)
- [02 — Add CharacterRecipe serializers with output masking](backend/02-add-character-recipe-serializers.md)
- [03 — Add PC/NPC recipe index and detail views](backend/03-add-character-recipe-read-views.md)
- [04 — Add the hidden-only PATCH](backend/04-add-character-recipe-hidden-patch.md)
- [05 — Add recipe → characters views](backend/05-add-recipe-characters-views.md)
- [06 — Document access control](backend/06-document-access-control.md)

## CI Checks

- `backend`: `make tests` / `docker-compose run --rm majora_tests pytest` (CI jobs:
  `pytest_views_characters`, `pytest_views_rest`, `pytest_all`), ruff via the `checks` job.
- `docs`: markdownlint (CI job: `markdownlint`). Keep blank lines around headings and lists.

## Notes

- Masking has a twist. On PC `CharacterEdit` variants (`all.json`, `full.json`, and the
  PATCH response), the owning player without `GameEdit` must still see a hidden output as
  `null`. Masking therefore depends on the caller, not only on the endpoint. Decide it in the
  view (`check_game_edit` succeeds → unmasked) and pass it to the serializer through its
  context. The class-level `mask_hidden_output` alone is not enough.
- E9: character endpoints ignore `GameRecipe.hidden`. Never filter or 404 on it here, except in
  the plain recipe → characters endpoint, where a hidden **recipe** returns `404`.
- NPC `incognito` affects only recipe → characters. It does not affect the character recipe
  endpoints.
