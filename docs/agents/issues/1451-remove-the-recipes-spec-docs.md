# Issue: Remove the recipes spec docs

## Description
Part of #1441 (crafting recipes). This is the last step: every other recipe sub-issue
(#1442–#1450, #1456, #1459) is closed, so the temporary recipes spec is retired, per the spec
convention in `docs/agents/specs.md` (a spec is removed once its feature area is implemented and
its lasting knowledge has moved into the permanent docs).

## Problem
`docs/agents/specs/recipes.md` and its aspect pages under `docs/agents/specs/recipes/`
(game-recipe, character-recipe, visibility, deletion, permissions, api-contract, frontend) are
still listed as an active spec even though the feature is fully shipped. Keeping them around
duplicates — and will drift from — the permanent docs and the code.

## Expected Behavior
- The recipes spec no longer exists and is no longer listed under "Active specs".
- All lasting recipe knowledge lives in the permanent docs; nothing in the repo links to the
  removed pages.

## Solution
1. **Verify coverage** (docs-only; the audit found the permanent docs already cover the spec, so
   only fill a gap if one is actually found):
   - `docs/agents/product/entities/game-recipe.md` — fields, relationships (incl.
     `CharacterRecipe`), hidden semantics, and the out-of-scope notes (no crafting mechanic, no
     ingredient entity, no skill-check entity).
   - `docs/agents/product.md` — entity index already lists `game-recipe`.
   - `docs/agents/access-control/game-recipe.md` and `character-recipe.md` — endpoints,
     tiers, output masking, available/acquire/remove, `can_exchange_recipe`; indexed from
     `docs/agents/access-control.md`.
   - `docs/agents/cache-warmer.md` — recipe Navi resources.
   - Frontend: no per-entity page docs exist under `docs/agents/frontend/` (the frontend spec's
     placement/routes/request-config details now live in the code), so no frontend doc is added.
   - No separate `CharacterRecipe` product entity page is created — it is documented inside
     `game-recipe.md` and `access-control/character-recipe.md`, matching how other join models
     (e.g. possessions) are handled.
2. **Delete** `docs/agents/specs/recipes.md` and the whole `docs/agents/specs/recipes/` folder.
3. **Remove** the `- [Recipes](specs/recipes.md)` entry from "Active specs" in
   `docs/agents/specs.md`.
4. **Fix links**: the only live link is the one in `specs.md`. Historical references inside
   `docs/agents/issues/` and `docs/agents/plans/` are left untouched.

No code changes.

## Benefits
- Single source of truth for recipes in the permanent docs, with no stale spec to drift.
- Closes out the #1441 recipes feature area.
