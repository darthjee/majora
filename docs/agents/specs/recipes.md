# Recipes

Design notes for crafting **recipes** (parent issue #1441). A `GameRecipe` is a
per-game recipe that produces exactly one `GameCommonItem` (potion, poison,
ammunition...); a `CharacterRecipe` records that a PC or NPC knows a recipe.

This spec is written in three phases — general domain design (#1442), API
contract (#1443) and frontend design (#1444) — and guides the implementation
sub-issues listed below. Every decision is transcribed from #1441; nothing here
is re-decided.

## Aspect pages

- [GameRecipe](recipes/game-recipe.md) — fields, validation, relationships
- [CharacterRecipe](recipes/character-recipe.md) — join model, constraints
- [Visibility](recipes/visibility.md) — hidden rules, output masking,
  category-filter masking, hidden default on link
- [Deletion](recipes/deletion.md) — cascade and remove behavior
- [Permissions](recipes/permissions.md) — permissions summary
- API contract (`recipes/api-contract.md`) — pending, added by #1443
- Frontend (`recipes/frontend.md`) — pending, added by #1444

## Out of scope

- Crafting as a mechanic (consuming ingredients / adding items to a character
  inventory) — characters have no common-item inventory today.
- Structured ingredients (an ingredient entity / links to `GameCommonItem` with
  quantities) — `ingredients` is free text.
- Structured skill checks (an entity of skill + difficulty options) — `checks`
  is free text.

## Sub-issues and sequencing

Parent: #1441.

| Issue | Scope | Depends on |
|-------|-------|------------|
| #1442 | Spec 1/3 — general domain design (this phase) | — |
| #1443 | Spec 2/3 — API contract | #1442 |
| #1444 | Spec 3/3 — frontend design | #1443 |
| #1445 | BE: `GameRecipe` model + read endpoints | #1444 |
| #1446 | BE: `GameRecipe` write endpoints | #1445 |
| #1447 | BE: `CharacterRecipe` | #1445 |
| #1448 | Navi cache resources | #1445, #1446, #1447 |
| #1449 | FE: game Recipes pages | #1446 |
| #1450 | FE: character recipes | #1447 |
| #1451 | Remove this spec | all of the above |

Order: #1442 → #1443 → #1444 → #1445 → #1446 ∥ #1447 → #1448 (after
#1445–#1447); #1449 after #1446; #1450 after #1447; #1451 last.

## Lifecycle

This spec is removed by #1451 once its lasting knowledge has moved into
`docs/agents/product/entities/` and `docs/agents/access-control/`.
