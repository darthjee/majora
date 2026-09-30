# Plan: Frontend: character recipes section and recipe 'Known by' section

Issue: [1450-frontend-character-recipes-section-and-recipe-known-by-section.md](../../issues/1450-frontend-character-recipes-section-and-recipe-known-by-section.md)

## Overview
Build the character-level recipe UI from `docs/agents/specs/recipes/frontend.md`. That means the
PC/NPC dropdown entry, the show-page "Recipes" shortlist, the full list and detail pages (detail
includes the hidden toggle), and the Exchange modal (acquire/remove) gated by
`can_exchange_recipe`. It also adds the "Known by" shortlist on the game recipe show page, which
#1449 handed over. The work builds on the merged backend (#1447, #1459, #1448) and the game
recipe pages from #1449 (`RecipePreviewCard`, `CardRecipeImage`, `recipeConfig.js`, the
`Recipe*Field` show elements). No backend, Navi or proxy changes.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API surface (already merged, consumed by frontend)

All paths are under `/games/:game_slug`. `:kind` is `pcs` or `npcs`.

| Endpoint | Regular | Restricted |
|---|---|---|
| Character list | `/:kind/:id/recipes.json` | `/:kind/:id/recipes/all.json` (adds `hidden`) |
| Character detail | `/:kind/:id/recipes/:character_recipe_id.json` | `.../:character_recipe_id/full.json` (adds `hidden`) |
| Available catalog | `/:kind/:id/recipes/available.json` | `.../recipes/available/all.json` |
| Acquire (POST `{game_recipe_id}`) | `.../recipes/acquire.json` | `.../recipes/acquire/all.json` |
| Remove (POST `{game_recipe_id}`) | `.../recipes/remove.json` | `.../recipes/remove/all.json` |
| Toggle hidden (PATCH `{hidden}`) | `.../recipes/:character_recipe_id.json` | same |
| Known by | `/recipes/:id/characters.json` | `/recipes/:id/characters/all.json` (adds `hidden`) |

- `CharacterRecipe` list entry: `id` (row id), `game_recipe_id`, `name`, `output` (object or `null`
  when masked, with `id`/`name`/`photo_path`), `yield_quantity`, `crafting_time`, `crafting_cost`
  (+ `hidden` on restricted variants).
- Detail adds `description`, `ingredients`, `checks`.
- "Known by" entry: `id` (**character** id), `name`, `photo_path`, `type` (`'pc'` | `'npc'`),
  (+ `hidden` on `all.json`).
- `can_exchange_recipe` (boolean) in `GET /permissions/game_pc.json` / `game_npc.json` payloads.
- Acquire/remove statuses: `201`/`204` success, `422` already known, `404` not found/hidden,
  `400` invalid.

### i18n keys (produced by translator, consumed by frontend)

Both `en` and `pt`, in parity:

- `common.yaml` → `character_page.recipes_title` (PC/NPC nav label + shortlist title).
- `common.yaml` → `recipe_exchange_modal.*`, mirroring `document_exchange_modal` /
  `possession_exchange_modal`'s key set: `title`, `search_placeholder`, `acquire_tab`,
  `acquire_tab_tooltip`, `remove_tab`, `remove_tab_tooltip`, `hidden_label`, `confirm`, `cancel`,
  `back`, `cancel_selection`, `loading`, `empty`, `load_error`, `already_owned_error` (the `422`
  "already known" case), `not_found_error` (`404`), `generic_error` (`400` and anything else).
  Add `recipe_exchange_modal` to `commonNamespaces` in `frontend/assets/i18n/{en,pt}/index.js`.
- `character_recipes_page.yaml` → `title`, `exchange_button`, `hidden_label`, `empty`.
- `character_recipe_page.yaml` → `back_link`, `game_recipe_link`, `hidden_toggle_label`,
  `not_found`.
- `character_recipes_preview.yaml` → `empty`.
- `recipe_characters_preview.yaml` → `empty`.
- `recipe_page.yaml` → add `known_by_title`.

The detail page reuses the existing `recipe_page.*` field labels (`output_label`,
`unknown_output`, `yield_label`, `crafting_time_label`, `crafting_cost_label`,
`description_title`, `ingredients_title`, `checks_title`), so they are not duplicated.
