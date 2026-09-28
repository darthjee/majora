# Plan: Recipes spec (1/3): general domain design for GameRecipe / CharacterRecipe

Issue: [1442-recipes-spec-1-3-general-domain-design-for-gamerecipe-characterrecipe.md](../../issues/1442-recipes-spec-1-3-general-domain-design-for-gamerecipe-characterrecipe.md)

## Overview

Docs-only. Create the recipes spec index `docs/agents/specs/recipes.md` and five per-concern
aspect pages under `docs/agents/specs/recipes/`, transcribing the decisions already made in
#1441 (nothing re-decided), and register the spec under "Active specs" in
`docs/agents/specs.md`.

## Context

#1441 (crafting recipes) was enhanced and split into #1442–#1451. This is the first of three
spec phases (general → API contract #1443 → frontend #1444). Downstream sub-issues
(#1443, #1444, #1445, #1447) already reference the index and the page names below, so the
file names are fixed:

- `docs/agents/specs/recipes.md` (index)
- `docs/agents/specs/recipes/game-recipe.md`
- `docs/agents/specs/recipes/character-recipe.md`
- `docs/agents/specs/recipes/visibility.md`
- `docs/agents/specs/recipes/deletion.md`
- `docs/agents/specs/recipes/permissions.md`

Shape follows `docs/agents/specs/loot-crawling.md` (index with an "Aspect pages" list) and its
`loot-crawling/*.md` pages. Formatting follows `docs/agents/documentation.md` (blank lines
around headings and lists; Codacy lints Markdown).

## Steps

- [01 — Write the spec index](plan/01-spec-index.md)
- [02 — Write the aspect pages](plan/02-aspect-pages.md)
- [03 — Register the spec](plan/03-register-spec.md)

## Notes

- Source of truth for every decision is #1441's body; if the issue and #1441 disagree,
  #1441 wins and the discrepancy should be noted in the PR.
- Endpoint-level detail (routes, per-endpoint permission tiers, response shapes) belongs to
  #1443 — `permissions.md` stays a summary and links forward to the contract page
  (`recipes/api-contract.md`, to be created by #1443) as "pending".
- No code, no product/access-control doc changes — those move into permanent docs in #1451.
