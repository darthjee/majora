# Issue: Add CharacterRecipe model and endpoints (link recipes to PCs/NPCs)

## Description

Part of #1441 (crafting recipes). This issue implements `CharacterRecipe`, a thin join recording that a PC or NPC knows a `GameRecipe`, along with its read endpoints, the `hidden` toggle and the recipe → characters listing. The recipes spec is binding: `docs/agents/specs/recipes/character-recipe.md`, `visibility.md`, `deletion.md` and `permissions.md`, and `docs/agents/specs/recipes/api-contract.md` for routes, tiers and status codes. Depends on `GameRecipe` (#1445 and #1446, both merged).

Out of scope:

- The available / acquire / remove flow, the `game_pc_recipe` / `game_npc_recipe` `endpoints.yml` files and the `can_exchange_recipe` flag. These were split into #1459.
- Navi (#1448) and frontend (#1449, #1450).

## Problem

`GameRecipe` exists, but nothing records which PCs or NPCs know a recipe, and there is no way to list the characters who know one.

## Expected Behavior

**Model**

- `CharacterRecipe` in `backend/games/models/character/character_recipe.py`, modeled on `CharacterPossession`: `character` (FK, CASCADE), `game_recipe` (FK, CASCADE), `hidden` (bool), unique `(character, game_recipe)`, `HistoricalRecords`. Includes a migration and Django admin registration.
- On character endpoints, only `CharacterRecipe.hidden` matters; `GameRecipe.hidden` is ignored (E9).

**Character recipe endpoints** (`/games/<slug>/pcs|npcs/<id>/recipes...`; tiers written as PC / NPC)

- `recipes.json` (AllowAny): supports `?name=` and is paginated. `recipes/all.json` (CharacterEdit / GameEdit) adds `hidden` and sets `X-Skip-Cache: true`.
- `recipes/<character_recipe_id>.json` (AllowAny): returns `404` if the link is hidden, unknown or belongs to another character. `/full.json` (CharacterEdit / GameEdit) returns the link even when hidden, adds `hidden`, and sets `X-Skip-Cache: true`.
- `PATCH recipes/<character_recipe_id>.json` (CharacterEdit / GameEdit):
  - only `hidden` is writable;
  - checks run in order: hidden-NPC gate → 401/403 → row lookup;
  - does not `404` on a hidden link;
  - returns the `/full.json` shape with `X-Skip-Cache: true`.
- Output masking: the embedded output item is `null` when it is hidden. This applies on plain variants for everyone, and on PC CharacterEdit variants for callers without GameEdit.
- On NPC routes, the hidden-NPC gate runs before the permission check. When it serves a dm/superuser, it sets `X-Skip-Cache: true`. NPC `incognito` has **no** effect on these endpoints.

**Recipe → characters**

- `/games/<slug>/recipes/<id>/characters.json` (AllowAny):
  - returns a mixed list of PCs and NPCs;
  - returns `404` if the recipe is hidden or unknown;
  - excludes hidden links and hidden or incognito NPCs;
  - is paginated, ordered by name then id;
  - does not set `X-Skip-Cache`.
- `/characters/all.json` (GameEdit): includes everything, exposes `CharacterRecipe.hidden`, and sets `X-Skip-Cache: true`.
- Both reuse the `game_recipe` read tiers; they have no `endpoints.yml` keys of their own.

**Docs and tests**

- `docs/agents/access-control/character-recipe.md` plus its index entry. #1459 extends this page with the write flow.
- Model, view and serializer tests for the rules above.

## Solution

- Mirror `CharacterPossession` for the model and the `hidden` flag.
- Mirror the `CharacterDocument` index/detail views for PCs and NPCs.
- Mirror `/games/<slug>/factions/<id>/characters.json` for recipe → characters.
- Reuse the `GameRecipe` serializers and output-masking logic from #1445.

## Benefits

Delivers the `CharacterRecipe` model and read side that #1459 (write flow), #1448 (Navi) and #1450 (frontend) build on.
