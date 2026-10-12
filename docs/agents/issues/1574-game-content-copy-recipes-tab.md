# Issue: Game content copy: Recipes tab

## Description
Part of "copy content between games" (epic #1550): the **Recipes** tab. Copies a `GameRecipe` into the target game; its required `GameCommonItem` is reused when the target already holds a direct copy of it, else it is copied (with its cover link) in the same transaction.

Design source of truth: `docs/agents/specs/game-content-copy/recipes.md`, on top of the global pages (`copy-flow.md`, `hard-links.md`, `permissions.md`, `page.md`; index `docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win.

## Expected Behavior
### Backend
- A `RecipesCopyType` (`ModelCopyType` subclass, e.g. `backend/staff/copy_types_recipes.py`) registered in `staff.copy_types.COPY_TYPES` **between** `common_items` and `documents` (the spec's tab order).
- `GET staff/copies/recipes.json?from=&to=` — paginated, ordered by `id`, every recipe of the source (hidden included). Row fields: `id`, `name`, `hidden`, `yield_quantity`, `crafting_cost`, `common_item: {id, name, copied_to_target}`, `copied_to_target`. `copied_from` is never exposed.
- `POST staff/copies/recipes/<id>.json {target}` — in one transaction: copies `name`, `description`, `yield_quantity`, `crafting_time`, `crafting_cost`, `ingredients`, `checks`, `hidden`; sets `game` = target and `copied_from` = source; returns `201 {id, links}`.
- Common item resolution:
  - **Reuse** the target `GameCommonItem` whose `copied_from` is the source recipe's common item (highest `id` if several); left unchanged, no link.
  - **Direct lookup only** — the `copied_from` chain is never walked.
  - **Copy** otherwise, via `CommonItemsCopyType.copy_instance` (all common-items rules, incl. the `is_cover=true` cover link when the source cover is ready); a failure rolls back both rows.
  - `links` holds 0 or 1 entry: the dependency common item's cover, only when it was copied.
- Not copied: `CharacterRecipe` rows, history. Name clashes allowed (never `422`).
- No new pending-links photo type (a dependency cover is a `GameCommonItemPhoto`, already covered).

### Cache (`X-Cache-Clear` on the copy `201`, cleared on every domain)
- Recipe family of the target via `GameResourceCachePaths('recipes', **FULL_FAMILY)`: `recipes.json`, `recipes/all.json`, `recipes/<copy-id>.json`, `recipes/<copy-id>/full.json`.
- The resolved common item's nested lists (reused or copied): `common_items/<ci-id>/recipes.json`, `common_items/<ci-id>/recipes/all.json`.
- When the common item is copied: the common item family as in `common_items_copy_cache_paths`; its cover link's finalize clears that family again (existing common-items behavior).
- **Not** cleared: `recipes/<copy-id>/characters*.json` (fresh copy) and the characters' `recipes/available*.json` (always `X-Skip-Cache`).

### Frontend
- The Recipes tab row component: checkbox; name; common item name with a "reused" indicator when `common_item.copied_to_target`, else "will be copied"; hidden badge; "already copied" flag. The indicator reflects the list as loaded (no live update within a run).
- New i18n keys in every language.

## Solution
- Agents: `backend`, `frontend` (+ `translator` for new keys). Reviews: `data-access`, `security`; `cache` confirms the `X-Cache-Clear` paths and that no Navi resource is needed.
- Backend reuses the existing `ModelCopyType` hooks; since `game_common_item` is a required FK, the common item must be resolved/copied **before** the recipe row is created (override `copy_instance`/`_create_copy` to inject it, and merge the dependency's uploads and cache paths).
- Tests: the per-type cases in the spec's "Testing" section (reuse, most-recent copy, chain not walked, copy-in-transaction with/without ready cover, rollback of both, `CharacterRecipe` not copied, name clash, list rows incl. nested `common_item`, hidden listed, cache paths for reuse and copy; frontend row rendering).

### Depends on
#1573 (Common items tab) — merged.

### Out of scope
The regular recipe create/update views sending no `X-Cache-Clear` (noted in the spec); the copy lists its own paths.

## Benefits
Staff can copy Recipes between games, reusing already-copied common items instead of duplicating them.
