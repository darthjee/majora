# Plan: Game content copy spec: Items tab

Issue: [1552-game-content-copy-spec-items-tab.md](../../issues/1552-game-content-copy-spec-items-tab.md)

## Overview

Docs-only change: write the **Items** tab page of the game-content-copy spec
(`docs/agents/specs/game-content-copy/items.md`) and link it from the spec index. The page
references the global pages (`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`, merged
in #1551) and only adds what is specific to `GameItem`. Owned by the `architect` (spec docs); no
specialist has code work.

## Context

- `GameItem` (`backend/games/models/game/game_item.py`): `game`, `name`, `description`, `hidden`,
  cover `photo` FK → `GameItemPhoto` (`SET_NULL`), `HistoricalRecords`. No unique name
  constraint.
- `GameItemPhoto` (`backend/games/models/game/game_item_photo.py`): `BasePhoto` (`path`, `ready`)
  + `game_item` FK (`related_name='photos'`).
- A `GameItem` has **at most one** photo: `game_item_photo_upload`
  (`backend/games/views/games/game_item_photo_upload.py`) reuses the item's cover row and builds
  the fixed path `PhotoPathBuilder(['games', slug, 'items', id], f'photo{ext}', use_uuid=False)`.
  A re-upload sets that row back to `ready=false` until finalized.
- `CharacterItem` points to `GameItem`, with its own `CharacterItemPhoto` overrides — never copied.
- Cache family: staff photo type `game_item` uses
  `GameResourceCachePaths('items', **FULL_FAMILY)` (`backend/staff/photo_types.py`,
  `backend/staff/photo_cache_paths.py`), i.e. `/games/<slug>/items.json`,
  `/games/<slug>/items/all.json`, `/games/<slug>/items/<id>.json`,
  `/games/<slug>/items/<id>/full.json`.
- Decisions taken in the issue discussion: copy only the ready cover photo (other
  `GameItemPhoto` rows ignored); list row `{id, name, hidden, photo, copied_to_target}`; hidden
  source items are listed and flagged.

## Implementation Steps

### Step 1 — Write `docs/agents/specs/game-content-copy/items.md`

Header in the same shape as the global pages: "Part of the [Game Content Copy](../game-content-copy.md)
spec", stating it only adds the Items-specific rules and links the global pages. Sections:

- **Model** — tab slug `items`, model `GameItem`, label "Items".
- **Copied fields** — `name`, `description`, `hidden` (kept as source, link to
  `copy-flow.md#hidden`); `game` = target; `copied_from` = source
  (`copy-flow.md#copied_from`); `photo` null at copy time (`copy-flow.md#cover-photo`).
- **Not copied** — `CharacterItem` rows and their `CharacterItemPhoto` overrides, history
  (`copy-flow.md#character-links-and-history`).
- **Photo** — at most one photo per item; only the cover `photo`, when `ready=true`, is copied;
  other `GameItemPhoto` rows (legacy orphans) are ignored, since they would collide on the fixed
  target path. One `GameItemPhoto` (`ready=false`) at
  `photos/games/<target-slug>/items/<copy-id>/photo<ext>` (same builder segments, `photo<ext>`
  name, no uuid, `root='photos'`, extension from the source path), with one copy-origin `Upload`
  (`upload_type=image`, `is_cover=true`). Its finalize (`CopyLinkFinalizer`) sets the copy's
  `photo` FK; `_set_item_photo` does not run. No photo / cover not ready → copy without photo and
  without link. Link to `hard-links.md#storage-roots` and `#finalize`.
- **Names** — clashes allowed, never a `422` for names (`copy-flow.md#names`).
- **API** — `GET staff/copies/items.json?from=&to=` (paginated, every source item including
  hidden ones, ordered by `id`) with rows `{id, name, hidden, photo, copied_to_target}` (`photo` =
  ready cover path or null); `POST staff/copies/items/<id>.json` `{target}` with the global
  responses; `links` holds 0 or 1 entry. Note that the list must expose `photo` only when the
  cover is `ready`. Pending-links query reaches the game via `GameItemPhoto.game_item__game`.
- **Cache** — `X-Cache-Clear` on copy and link finalize: the target game's item family
  (`/games/<target>/items.json`, `/items/all.json`, `/items/<copy-id>.json`,
  `/items/<copy-id>/full.json`), reusing `GameResourceCachePaths('items', **FULL_FAMILY)`;
  cleared cross-domain per `permissions.md#cache`.
- **Frontend** — columns: checkbox, cover thumbnail (placeholder when none), name, hidden badge,
  "already copied" flag; only the row component is tab-specific (`page.md#frontend-structure`).
- **Testing** — per-type cases on top of the global strategy: backend (fields/hidden/copied_from
  copied, photo null at copy, one link with `is_cover` for a ready cover, none for no photo /
  not-ready cover, non-cover `GameItemPhoto` ignored, `CharacterItem` not copied, name clash
  allowed, list fields and hidden rows, cache paths); frontend (row rendering: thumbnail,
  placeholder, hidden badge, copied flag).

Keep it short: reference, never restate, the global rules.

### Step 2 — Link the page from the index

In `docs/agents/specs/game-content-copy.md`, "Tab pages": turn "Items — #1552" into a link to
`game-content-copy/items.md` (e.g. `- [Items](game-content-copy/items.md) — #1552`), keeping the
other tabs pending.

## Files to Change

- `docs/agents/specs/game-content-copy/items.md` — new Items tab spec page.
- `docs/agents/specs/game-content-copy.md` — link the Items page in "Tab pages".

## CI Checks

- Markdown: `docker-compose run --rm <node service> yarn lint_md` (CI job: `markdownlint`).

## Notes

- No code changes; no backend/frontend/proxy/cache agent work.
- The photo `path` exposed in the list is a public upload path, as on regular item serializers;
  `copied_from` itself is never exposed (only `copied_to_target`).
