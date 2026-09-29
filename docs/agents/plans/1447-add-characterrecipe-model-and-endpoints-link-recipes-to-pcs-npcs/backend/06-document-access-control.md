# Document access control

- Create `docs/agents/access-control/character-recipe.md`, following
  `access-control/character-possession.md`. It should list every endpoint added here with its
  tier, the hidden rules (E9, output masking including the PC-owner case), the PATCH order of
  checks, and the NPC gate / incognito note. Say that the available / acquire / remove flow
  arrives in #1459.
- Add the page to the index in `docs/agents/access-control.md`.
- Update `docs/agents/access-control/game-recipe.md` with the recipe → characters endpoints.
- Add `CharacterRecipe` to the versioned models list in `docs/agents/access-control/versioning.md`.
- Mention `CharacterRecipe` in `docs/agents/product/entities/game-recipe.md`, or in
  `character.md` if that page lists character sub-resources.
- Run markdownlint on the touched files.

## Files to Change

- `docs/agents/access-control/character-recipe.md`: new page.
- `docs/agents/access-control.md`: index entry.
- `docs/agents/access-control/game-recipe.md`: recipe → characters rows.
- `docs/agents/access-control/versioning.md`: versioned-model entry.
- `docs/agents/product/entities/game-recipe.md` / `character.md`: entity cross-reference.
