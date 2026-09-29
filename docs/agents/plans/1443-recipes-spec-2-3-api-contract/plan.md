# Plan: Recipes spec (2/3): API contract

Issue: [1443-recipes-spec-2-3-api-contract.md](../../issues/1443-recipes-spec-2-3-api-contract.md)

## Overview
Docs only. Write `docs/agents/specs/recipes/api-contract.md`, the API contract for `GameRecipe` /
`CharacterRecipe` that #1445–#1450 implement against. Then correct the domain spec pages it
contradicts (the recipe photo was removed), and get the contract reviewed by the `data-access` and
`security` agents. Owned by the architect: no specialist agent owns `docs/agents/specs/`.

## Context
The domain spec (#1442) is already on `main`: `docs/agents/specs/recipes.md` plus
`recipes/game-recipe.md`, `character-recipe.md`, `visibility.md`, `deletion.md`, `permissions.md`.
Every decision the contract must encode was settled while enhancing the issue, and is recorded in
the issue file's **Solution** section. That section is the source of truth: transcribe it, don't
re-decide it. Shapes follow the sibling access-control pages
`docs/agents/access-control/game-common-item.md`, `character-possession.md`,
`character-document.md` and `faction.md`.

## Steps

- [01 — Write the API contract page](plan/01-write-api-contract.md)
- [02 — Correct the domain spec pages](plan/02-correct-domain-pages.md)
- [03 — Data-access and security review](plan/03-review.md)

## Notes
- No code, `endpoints.yml`, Navi or frontend changes; those belong to #1445–#1450.
- Do not name serializer or view classes in the contract.
- The contract, the domain pages and the specs index all go away later with #1451.
