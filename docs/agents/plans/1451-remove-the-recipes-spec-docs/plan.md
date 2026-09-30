# Plan: Remove the recipes spec docs

Issue: [1451-remove-the-recipes-spec-docs.md](../../issues/1451-remove-the-recipes-spec-docs.md)

## Overview

Retire the temporary recipes spec (#1441) now that all its implementation sub-issues are closed.
This is docs-only: confirm the permanent docs hold the spec's lasting knowledge, then delete the
spec files and its "Active specs" entry. No code changes.

## Context

Per `docs/agents/specs.md`, a spec is removed once its feature area is fully implemented and its
knowledge lives in the permanent docs. Every other #1441 sub-issue (#1442–#1450, #1456, #1459) is
closed. An audit during refinement found the permanent docs already cover the spec:

- `docs/agents/product/entities/game-recipe.md` — fields, relationships (incl. `CharacterRecipe`),
  hidden semantics, out-of-scope notes (no crafting mechanic, no ingredient/skill-check entity).
- `docs/agents/product.md` — entity index lists `game-recipe`.
- `docs/agents/access-control/game-recipe.md`, `character-recipe.md` — indexed from
  `docs/agents/access-control.md`.
- `docs/agents/cache-warmer.md` — recipe Navi resources.

The only live link to the spec is `docs/agents/specs.md:12`.

## Implementation Steps

### Step 1 — Verify permanent-doc coverage

Skim each spec aspect page (`docs/agents/specs/recipes/{game-recipe,character-recipe,visibility,deletion,permissions,api-contract,frontend}.md`)
against the permanent docs listed above. Only if a genuine, lasting rule is missing (e.g. a
visibility/masking or deletion rule not stated in the access-control or entity pages), add it to
the matching permanent page — keep additions minimal. Do not add a frontend doc (no per-entity
frontend docs exist; placement/routes/request configs live in code) and do not create a separate
`CharacterRecipe` entity page (documented in `game-recipe.md` and
`access-control/character-recipe.md`).

### Step 2 — Delete the spec and fix links

- `git rm docs/agents/specs/recipes.md` and `git rm -r docs/agents/specs/recipes/`.
- Remove the `- [Recipes](specs/recipes.md)` line from "Active specs" in `docs/agents/specs.md`.
- Re-grep for `specs/recipes` outside `docs/agents/issues/` and `docs/agents/plans/`; it must
  return nothing. Historical issue/plan files are left untouched.

## Files to Change

- `docs/agents/specs/recipes.md` — delete.
- `docs/agents/specs/recipes/` (7 files) — delete.
- `docs/agents/specs.md` — drop the Recipes entry from "Active specs".
- `docs/agents/product/entities/game-recipe.md`, `docs/agents/access-control/game-recipe.md`,
  `docs/agents/access-control/character-recipe.md` — only if Step 1 finds a real gap.

## CI Checks

- Markdown: CircleCI `markdownlint` job runs over the changed `.md` files.

## Notes

- Owner: architect (docs under `docs/agents/` are cross-cutting; no specialist agent owns them).
- Low risk: no code, config, or test changes.
