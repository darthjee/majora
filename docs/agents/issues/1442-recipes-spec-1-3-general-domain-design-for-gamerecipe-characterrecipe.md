# Issue: Recipes spec (1/3): general domain design for GameRecipe / CharacterRecipe

## Description
First of three spec-writing phases for #1441 (crafting recipes). A **GameRecipe** is a per-game recipe that produces exactly one `GameCommonItem` (potion, poison, ammunition...); a **CharacterRecipe** records that a PC/NPC knows a recipe. This phase captures the domain design; the API contract (#1443) and frontend design (#1444) build on it.

## Problem
The decisions for recipes currently live only in the body of #1441. The implementation sub-issues (#1445–#1450) need a stable, in-repo source of truth to implement against, following the spec convention in `docs/agents/specs.md`.

## Expected Behavior
- `docs/agents/specs/recipes.md` exists as the spec index (shape of `docs/agents/specs/loot-crawling.md`) and is listed under "Active specs" in `docs/agents/specs.md`.
- The domain design below is documented in **one aspect page per concern** under `docs/agents/specs/recipes/`, transcribed from #1441 — nothing re-decided:
  - `game-recipe.md` — GameRecipe fields, validation, relationships
  - `character-recipe.md` — CharacterRecipe join, constraints
  - `visibility.md` — hidden rules, output masking, category-filter masking, link-default hidden
  - `deletion.md` — cascade and remove behavior
  - `permissions.md` — permissions summary (the detailed per-endpoint tiers come with the contract, #1443)
- The index `recipes.md` also holds the feature summary, out-of-scope list, and the **sub-issue list with sequencing**:
  #1442 → #1443 → #1444 (specs) → #1445 → #1446 ∥ #1447 → #1448 (after #1445–#1447); #1449 after #1446; #1450 after #1447; #1451 last.
- Docs only — no code changes.

## Solution
Write the aspect pages listed above, covering:

- **GameRecipe fields**: `game`, `name`, `description` (markdown), `photo` (own `GameRecipePhoto` model, single always-replaced photo like `GameCommonItemPhoto`), `hidden`, `game_common_item` (required FK, same game, editable, `on_delete=CASCADE`; several recipes may produce the same item), `yield_quantity` (int, min 1, default 1), `crafting_time` (free text, max 200, default `""`), `crafting_cost` (int in the lowest denomination like `GameCommonItem.price`, min 0, default 0), `ingredients` (free-text markdown, default `""`), `checks` (free-text markdown describing the skill/difficulty options any of which a character can use, default `""`). Duplicate names allowed. History via `HistoricalRecords` like sibling models.
- **CharacterRecipe**: thin join like `CharacterPossession` — `character`, `game_recipe`, own `hidden`; unique `(character, game_recipe)`; display fields come from the `GameRecipe`; recipe and character must share the game; cascades on character/recipe deletion.
- **Visibility**: default hidden-gated collection pattern; a visible recipe whose output item is hidden returns the output **masked (`null`)** on plain endpoints (also inside CharacterRecipe responses), and a masked recipe never matches a category filter; `CharacterRecipe.hidden` is independent of `GameRecipe.hidden`; a new CharacterRecipe copies `GameRecipe.hidden`; hidden recipes can only be linked through the GM `acquire/all` variant; hidden-NPC gate / incognito cascade apply.
- **Deletion**: no delete endpoint for GameRecipe (admin only); deleting a `GameCommonItem` cascades to its recipes and their CharacterRecipes; CharacterRecipe has a remove flow.
- **Permissions summary**: GameRecipe create/edit/photo = staff + any player (like GameCommonItem); CharacterRecipe link/remove = regular tier (staff, player, owner for PCs; staff, player for NPCs); only existing recipes can be linked (no create-from-scratch).
- **Out of scope** (in the index): crafting mechanics/inventory, structured ingredients, structured checks.

## Benefits
A single reviewed source of truth for the contract (#1443), frontend (#1444) and implementation (#1445–#1450) sub-issues, removed at the end (#1451) once the knowledge moves into the permanent docs.
