# Plan: Game content copy spec: Recipes tab

Issue: [1554-game-content-copy-spec-recipes-tab.md](../../issues/1554-game-content-copy-spec-recipes-tab.md)

## Overview

Write the Recipes tab page of the Game Content Copy spec,
`docs/agents/specs/game-content-copy/recipes.md`, and link it from the spec index. Docs only: no
code changes. The page mirrors the structure of `items.md` and `common-items.md`, references the
global pages instead of repeating them, and adds the one recipe-specific rule: how the required
`game_common_item` FK is resolved in the target game.

## Context

- `GameRecipe` (`backend/games/models/game/game_recipe.py`): `game`, `name`, `description`,
  `hidden`, `game_common_item` FK → `GameCommonItem` (`CASCADE`, `related_name='recipes'`),
  `yield_quantity`, `crafting_time`, `crafting_cost`, `ingredients`, `checks`, history. No photo
  model, no cover FK, no unique name constraint.
- `copy-flow.md#same-game-references` already defers the `game_common_item` resolution to this
  issue; `common-items.md#recipes-tab-interaction` already states that a common item copied as a
  dependency follows every Common items rule.
- `page.md` copies selected entities **sequentially**, so two selected recipes sharing an
  uncopied common item end up sharing one copy (the second request reuses the first's copy).
- Decisions settled in the issue discussion:
  - reuse lookup is **direct only**: a target `GameCommonItem` whose `copied_from` is the
    recipe's source common item; the `copied_from` chain is never walked (A1 → B1, copied back
    into A, copies a new item instead of reusing A1);
  - several matching copies → the **most recent** (highest `id`);
  - list rows expose a nested `common_item: {id, name, copied_to_target}`.

## Implementation Steps

### Step 1 — Write `recipes.md`

Create `docs/agents/specs/game-content-copy/recipes.md` with the same intro paragraph as the
sibling tab pages, then these sections:

1. **Model** — tab slug `recipes`, label "Recipes", `GameRecipe` and its fields (path above);
   recipes have no photos (consistent with `hard-links.md` line 42).
2. **Copied fields** — table: `name`, `description`, `yield_quantity`, `crafting_time`,
   `crafting_cost`, `ingredients`, `checks` → source value; `hidden` → source value
   (`copy-flow.md#hidden`); `game` → target; `copied_from` → source recipe;
   `game_common_item` → resolved per the next section.
3. **Not copied** — `CharacterRecipe` rows pointing to the source, and the source's history
   (`copy-flow.md#character-links-and-history`).
4. **Common item** — the dependency rule:
   - reuse: the target's `GameCommonItem` with `copied_from` = the source recipe's common item,
     most recent (highest `id`) when several; left unchanged (no field update, no new link);
   - direct lookup only, with the A1 → B1 → A example;
   - otherwise: copy the common item **inside the same transaction**, following every rule of
     `common-items.md` (sibling link) (copied fields, `hidden`,
     `copied_from`, cover photo row + copy-origin `Upload` with `is_cover=true`); the recipe
     points to the new copy; a failure rolls both back;
   - a hidden source common item is copied hidden, like any common item copy;
   - sequential copies: a later recipe sharing the same common item reuses the copy made by an
     earlier one in the same batch.
5. **Names** — clashes allowed (no unique constraint), never `422` (`copy-flow.md#names`).
6. **API** — global shapes in `copy-flow.md#api`:
   - `GET staff/copies/recipes.json?from=<slug>&to=<slug>` — paginated, ordered by `id`, every
     recipe of the source game (hidden included). Row fields table: `id`, `name`, `hidden`,
     `yield_quantity`, `crafting_cost`, `common_item: {id, name, copied_to_target}` (source
     common item; `copied_to_target` = it will be reused instead of copied), `copied_to_target`
     (the recipe itself);
   - `POST staff/copies/recipes/<id>.json` `{target}` — global responses; `links` holds 0 or 1
     entry: the dependency common item's cover, only when the common item is copied and its cover
     is ready;
   - pending-links query: recipes add no photo type of their own; a dependency cover is a
     `GameCommonItemPhoto`, already covered by `common-items.md`;
   - `copied_from` never exposed, only `copied_to_target` flags.
7. **Cache** — `X-Cache-Clear` on the copy `201`, every domain (`permissions.md#cache`):
   - recipe family of the target: `/games/<target>/recipes.json`, `/recipes/all.json`,
     `/recipes/<copy-id>.json`, `/recipes/<copy-id>/full.json` (built with
     `GameResourceCachePaths('recipes', ...)` from `backend/staff/photo_cache_paths.py`);
   - the resolved common item's nested lists:
     `/games/<target>/common_items/<common-item-id>/recipes.json` and `/recipes/all.json`
     (reused or copied — the reused one gains a recipe);
   - when the common item is copied: the common item family exactly as in
     `common-items.md#cache` (its cover link's finalize clears it too);
   - `/recipes/<copy-id>/characters*.json` need no clearing (a fresh copy has no characters).
8. **Frontend** — row component columns: checkbox; name; common item name with a
   "reused" / "will be copied" indicator from `common_item.copied_to_target`; hidden badge;
   "already copied" flag. Note the indicator reflects the list snapshot; after copying a recipe
   the page refresh updates it.
9. **Testing** — per-type cases on top of the global strategy:
   - backend: copied fields and `copied_from`; `game` = target; reuse of an existing direct copy
     (no new common item, no link); most recent copy chosen among several; chain not walked;
     common item copied in the same transaction when no copy exists (fields, `hidden`,
     `copied_from`, cover link with `is_cover=true`, no link when no/not-ready cover);
     rollback of both on failure; `CharacterRecipe` not copied; name clash allowed; list row
     fields including nested `common_item.copied_to_target`; hidden recipes listed;
     `X-Cache-Clear` paths for both the reuse and copy cases;
   - frontend: row rendering — common item name, reused / will-be-copied indicator, hidden
     badge, "already copied" flag.

### Step 2 — Link from the index

In `docs/agents/specs/game-content-copy.md`, under **Tab pages**, replace `- Recipes — #1554`
with `- [Recipes](game-content-copy/recipes.md) — #1554`.

## Files to Change

- `docs/agents/specs/game-content-copy/recipes.md` — new Recipes tab spec page.
- `docs/agents/specs/game-content-copy.md` — link the new page in **Tab pages**.

## CI Checks

- `docs/`: markdownlint (`.markdownlint.json` at the repo root) — run through the project's
  docker-compose/make tooling as described in `AGENTS.md`.

## Notes

- Characters' "available recipes" lists (`/games/<target>/{pcs,npcs}/<id>/recipes/available*.json`)
  gain a new entry after a copy. Check how `permissions.md#cache` and the regular recipe create
  view handle this; if the regular create does not clear them, the copy need not either —
  state the chosen behavior explicitly in the Cache section rather than leaving it implicit.
- Confirm the exact relative link format by copying it from `common-items.md`
  (`../game-content-copy.md#tab-pages`, sibling `common-items.md`).
