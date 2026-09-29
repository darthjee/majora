# Plan: Frontend: game Recipes pages

Issue: [1449-frontend-game-recipes-pages.md](../../issues/1449-frontend-game-recipes-pages.md)

## Overview
Build the game-level recipe UI (Game-dropdown nav entry, list / show / new / edit pages, and the
"Recipes that produce it" shortlist on the common item show page) per
`docs/agents/specs/recipes/frontend.md`, against the already-merged GameRecipe API. The output
selector needs one small backend change: an optional `?name=` filter on the common-item indexes.
The recipe "Known by" shortlist and the `recipe.characters` wiring are **out of scope** (owned by
#1450).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Common-item `?name=` filter (backend → frontend)

- `GET /games/:game_slug/common_items.json?name=<text>` and
  `GET /games/:game_slug/common_items/all.json?name=<text>` accept an optional `name` query param:
  a case-insensitive substring match on `GameCommonItem.name`. Absent or empty → no filtering
  (current behavior). It works together with `page` / `per_page`; the response shape (paginated
  list) and fields (`id`, `name`, `photo_path`, `price`, `category`, plus `hidden` on `/all.json`)
  are unchanged. Hidden-item filtering and `/all.json`'s GameEdit gate are unchanged.
- The frontend's `SingleResourcePickerField` (API mode, `resource: 'commonItem'`) sends
  `?name=<search>&per_page=5` through `commonItem.collection`.

### Recipe API (already merged, consumed by frontend)

- `GET /games/:slug/recipes.json` / `recipes/all.json` (GameEdit) — paginated list items:
  `id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`,
  `output` (`{id, name, photo_path, category}` or `null` when masked), plus `hidden` on `/all.json`.
  Accepts `?category=`.
- `GET /games/:slug/recipes/:id.json` / `:id/full.json` (GameEdit) — the list fields plus
  `description`, `ingredients`, `checks` (plus `hidden` on `/full.json`).
- `POST /games/:slug/recipes.json`, `PATCH /games/:slug/recipes/:id.json` — write fields:
  `name`, `game_common_item_id`, `yield_quantity`, `crafting_time`, `crafting_cost`,
  `description`, `ingredients`, `checks`, `hidden`. `400` on an invalid `game_common_item_id`.
- `GET /games/:slug/common_items/:id/recipes.json` / `recipes/all.json` (GameEdit) — paginated
  recipe list for the "Recipes that produce it" shortlist.
- `GET /permissions/game_recipe.json` → `can_edit` (gates the Edit link only);
  game permissions payload → `can_create_recipe` (gates "New").

### i18n keys (frontend ↔ translator)

The frontend uses exactly these keys; the translator adds them in `en` and `pt`:

- `game_page.yaml`: `game_page.recipes`
- `game_recipes_page.yaml`: `title`, `loading`, `new_button`, `hidden_label`, `unknown_output`,
  `yield_format` (`"{{output}} × {{yield}}"`), `category_filter_label`, `category_filter_all`,
  `empty`
- `recipe_page.yaml`: `loading`, `edit_button`, `output_label`, `unknown_output`, `yield_label`,
  `crafting_time_label`, `crafting_cost_label`, `description_title`, `ingredients_title`,
  `checks_title`, `hidden_label`
- `recipe_new_page.yaml` / `recipe_edit_page.yaml`: `title`, `name_label`, `output_label`,
  `output_placeholder`, `yield_label`, `crafting_time_label`, `crafting_cost_label`,
  `crafting_cost_edit_button`, `description_label`, `ingredients_label`, `checks_label`,
  `hidden_label`, `submit`, `hidden_notice`, `errors.invalid_output`
- `common_item_recipes_preview.yaml`: `title`, `empty`

The frontend agent may add a key it needs beyond this list, but must record it in its final
report so the translator's files stay in parity.
