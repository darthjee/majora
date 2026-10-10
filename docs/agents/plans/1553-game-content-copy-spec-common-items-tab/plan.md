# Plan: Game content copy spec: Common items tab

Issue: [1553-game-content-copy-spec-common-items-tab.md](../../issues/1553-game-content-copy-spec-common-items-tab.md)

## Overview

Docs-only: write the **Common items** tab page of the game-content-copy spec,
`docs/agents/specs/game-content-copy/common-items.md`, mirroring the structure of the merged
Items page (`items.md`, #1552), and link it from the spec index. No code changes.

## Context

- Global pages (#1551, merged): `page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`
  under `docs/agents/specs/game-content-copy/`. The tab page references them (with anchors, as
  `items.md` does) and only adds what is specific to `GameCommonItem`.
- `GameCommonItem` (`backend/games/models/game/game_common_item.py`): `game`, `name`, `price`
  (int), `description`, cover `photo` FK → `GameCommonItemPhoto` (`SET_NULL`, `related_name='+'`),
  `hidden`, `category` (`potion`/`drug`/`consumable`/`ammunition`/`poison`/`gear`/`other`,
  default `other`), history.
- `GameCommonItemPhoto` (`backend/games/models/game/game_common_item_photo.py`): `BasePhoto` +
  `game_common_item` FK (`related_name='photos'`).
- `game_common_item_photo_upload`
  (`backend/games/views/games/game_common_item_photo_upload.py`) reuses the cover row and writes
  the fixed path `games/<slug>/common_items/<id>/photo<ext>` (`use_uuid=False`) — at most one
  photo per common item, exactly like `GameItem`. Hence: **cover only** is copied (decided in the
  issue discussion, overriding the original "every photo" wording).
- Regular finalize: `_set_common_item_photo` in `backend/uploads/views.py` — not run for copies
  (`CopyLinkFinalizer` sets the FK instead).
- Cache family: `PhotoType('game_common_item', ..., cache_paths=GameResourceCachePaths('common_items', **FULL_FAMILY))`
  in `backend/staff/photo_types.py`; routes `games/<slug>/common_items.json`, `/all.json`,
  `/<id>.json`, `/<id>/full.json` (`backend/games/urls/games.py`). The nested
  `/common_items/<id>/recipes*.json` routes need no clearing (a fresh copy has no recipes).
- `GameRecipe.game_common_item` FK points to common items; the Recipes tab (#1554) copies a
  recipe's common item when the target has no copy yet, following "the Common items rules".

## Implementation Steps

### Step 1 — Write `common-items.md`

Create `docs/agents/specs/game-content-copy/common-items.md` with the same sections as
`items.md`:

- **Intro**: part of the spec; links to the four global pages.
- **Model**: tab slug `common_items`, label "Common items", `GameCommonItem` fields (above) and
  `GameCommonItemPhoto`.
- **Copied fields** table: `name`, `price`, `description`, `category` → source value; `hidden` →
  source (link `copy-flow.md#hidden`); `game` → target;
  `copied_from` → source; `photo` → null at copy time, set by the cover link's finalize.
- **Not copied**: recipes pointing to the source (`GameRecipe.game_common_item`) — the Recipes
  tab copies a recipe's common item, never the other way round; the source's history. No
  character links exist for common items.
- **Photo**: at most one photo (fixed path, no uuid); only the ready cover is copied; other
  `GameCommonItemPhoto` rows ignored (would collide on the fixed target path); copy row
  `ready=false` at `photos/games/<target-slug>/common_items/<copy-id>/photo<ext>`
  (`root='photos'`, extension kept); one copy-origin `Upload` (`upload_type=image`,
  `is_cover=true`); finalize via `CopyLinkFinalizer`, `_set_common_item_photo` does not run; no
  photo / not-ready cover → no link.
- **Names**: clashes allowed, never `422` for names.
- **API**: `GET staff/copies/common_items.json?from=&to=` (paginated, ordered by `id`, every
  common item including hidden) with rows `{id, name, category, price, hidden, photo,
  copied_to_target}` (`photo` = ready cover path or null; `category` is the raw choice value);
  `POST staff/copies/common_items/<id>.json` `{target}` (`links` holds 0 or 1 entry);
  pending-links query reaches the game through `game_common_item__game`; `copied_from` never
  exposed.
- **Cache**: copy `201` and cover finalize send `X-Cache-Clear` for the four
  `/games/<target>/common_items...` paths on every domain, built with
  `GameResourceCachePaths('common_items', **FULL_FAMILY)` like the `game_common_item` staff photo
  type.
- **Recipes tab**: a common item copied as a recipe dependency (#1554) follows exactly these
  rules (fields, cover link, `copied_from`), so it then shows here as already copied.
- **Frontend**: row columns — checkbox, cover thumbnail (placeholder when null), name, category
  (translated with the existing common item category i18n keys), price, hidden badge, "already
  copied" flag.
- **Testing**: backend — fields incl. `price`/`category` copied, `game`/`copied_from`, `photo`
  null at copy time, cover link path/extension/`is_cover`, no link for no / not-ready cover,
  non-cover photo ignored, recipes not copied, name clash allowed, list row fields (incl.
  `category`/`price`, `photo` only when ready, hidden listed), finalize sets `photo`,
  `X-Cache-Clear` paths, pending-links query via `game_common_item__game`; frontend — row
  rendering (thumbnail/placeholder, category, price, hidden badge, copied flag).

### Step 2 — Link it from the index

In `docs/agents/specs/game-content-copy.md`, under "Tab pages", replace the plain
`- Common items — #1553` entry with
`- [Common items](game-content-copy/common-items.md) — #1553`.

## Files to Change

- `docs/agents/specs/game-content-copy/common-items.md` — new tab page.
- `docs/agents/specs/game-content-copy.md` — link the new page.

## Notes

- Verify the actual frontend i18n key for common item categories (under
  `frontend/assets/i18n/`) before citing it; if none is reusable, just say "translated".
- Keep relative links consistent with `items.md` (`page.md`, `copy-flow.md#...`, etc. — the
  page lives next to them).
