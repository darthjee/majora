# Write the spec index

Create `docs/agents/specs/recipes.md` containing:

- **Summary**: a `GameRecipe` is a per-game recipe producing exactly one `GameCommonItem`
  (potion, poison, ammunition...); a `CharacterRecipe` records that a PC/NPC knows a recipe.
- **Aspect pages** list linking the five pages from step 02, plus placeholders for the pages
  added by later phases: `api-contract.md` (#1443) and `frontend.md` (#1444), marked pending.
- **Out of scope**: crafting mechanics / character inventory of common items; structured
  ingredients (free-text `ingredients` instead); structured skill checks (free-text `checks`
  instead).
- **Sub-issues and sequencing**: #1442 → #1443 → #1444 (specs) → #1445 (GameRecipe model +
  read) → #1446 (GameRecipe write) ∥ #1447 (CharacterRecipe) → #1448 (Navi, after #1445–#1447);
  #1449 (FE game recipes) after #1446; #1450 (FE character recipes) after #1447; #1451 (remove
  this spec) last. Parent: #1441.
- A lifecycle note: this spec is removed by #1451 once its knowledge moves into
  `docs/agents/product/entities/` and `docs/agents/access-control/`.

## Files to Change

- `docs/agents/specs/recipes.md` — new spec index
