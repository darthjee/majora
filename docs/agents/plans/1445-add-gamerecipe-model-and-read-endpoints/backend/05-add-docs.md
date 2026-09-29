# Document access control and the product entity

- New `docs/agents/access-control/game-recipe.md`, following `game-common-item.md`. Cover:
  - a Game resource that follows the default hidden-gated collection pattern;
  - an endpoint table for the six read endpoints (tier, `404` rules, `X-Skip-Cache`);
  - output masking (whole `output` is `null` on plain variants when the common item is hidden);
  - category-filter masking and the unknown value returning an empty list;
  - no photo or uploads, and admin-only delete.

  Note that the write endpoints are added by #1446.
- Add a `GameRecipe` entry to the index in `docs/agents/access-control.md`, next to
  `GameCommonItem`.
- Add a common-item → recipes row to `docs/agents/access-control/game-common-item.md` (or a link
  to `game-recipe.md`) so the nested route can be found from there.
- New product entity doc `docs/agents/product/entities/game-recipe.md`: what a recipe is,
  relationships (`Game` 1–N, `GameCommonItem` 1–N as output), free-text
  `ingredients` / `checks`, money semantics of `crafting_cost`, and hidden semantics. Link it
  from the entities list in `docs/agents/product.md` if that file indexes them.

Run markdownlint through docker-compose.

## Files to Change

- `docs/agents/access-control/game-recipe.md` — new
- `docs/agents/access-control.md` — index entry
- `docs/agents/access-control/game-common-item.md` — cross-link
- `docs/agents/product/entities/game-recipe.md` — new
- `docs/agents/product.md` — index entry, if applicable
