# Plan: Game content copy spec: Possessions tab

Issue: [1557-game-content-copy-spec-possessions-tab.md](../../issues/1557-game-content-copy-spec-possessions-tab.md)

## Overview

Write the last tab page of the game content copy spec,
`docs/agents/specs/game-content-copy/possessions.md`, and link it from the spec index. The
page only adds what is specific to `GamePossession`. It combines the `items.md` shape (`name`,
`description`, `hidden`, name clashes allowed) with the `factions.md` photo rule (one cover
photo at a fixed `photo<ext>` path). It also clears every target character's cached
`possessions/available.json`. Docs only, owned by `architect`. No specialist agent has code work.

## Context

- Global pages to reference, not repeat: `page.md`, `copy-flow.md`, `hard-links.md`,
  `permissions.md` (all under `docs/agents/specs/game-content-copy/`).
- Templates to mirror: `items.md` (field copy, hidden badge, `FULL_FAMILY` cache) and
  `factions.md` (fixed-path single photo, "Photo" section wording).
- Code facts the page relies on:
  - `backend/games/models/game/game_possession.py`: `game`, `name` (200), `description`,
    `photo` FK → `GamePossessionPhoto` (`SET_NULL`, `related_name='+'`), `hidden`,
    simple-history. No unique constraint.
  - `backend/games/models/game/game_possession_photo.py`: `BasePhoto` + `game_possession` FK
    (`related_name='photos'`).
  - `backend/games/views/games/game_possession_photo_upload.py`: fixed path
    `PhotoPathBuilder(['games', slug, 'possessions', id], f'photo{ext}', use_uuid=False)`,
    reuses the cover row (`_reuse_or_create_photo`). `backend/uploads/views.py`
    `_set_possession_photo` always replaces the cover.
  - `backend/games/models/character/character_possession.py`: thin join, never copied.
  - `backend/staff/photo_types.py`: `PhotoType('game_possession', ...,
    cache_paths=GameResourceCachePaths('possessions', **FULL_FAMILY))`.
  - `backend/games/views/game/possessions/_possession_exchange.py`
    `character_possessions_available`: `X-Skip-Cache` only for a hidden character when
    `check_hidden` (NPC). So `/games/<slug>/{pcs,npcs}/<id>/possessions/available.json` is
    cached otherwise. The `available/all.json` builders always set `X-Skip-Cache`.

## Implementation Steps

### Step 1 — Write `possessions.md`

Create `docs/agents/specs/game-content-copy/possessions.md` with the same heading set and
tone as `factions.md`/`items.md`:

- **Intro**: one paragraph pointing to the global pages. Possessions have item-like fields,
  plus the single fixed-path photo of factions.
- **Model**: tab slug `possessions`, label "Possessions", `GamePossession` and
  `GamePossessionPhoto` as listed in Context.
- **Copied fields** table: `name`, `description`, `hidden` (source,
  `copy-flow.md#hidden`), `game` (target), `copied_from` (`copy-flow.md#copied_from`), `photo`
  (null at copy time, `copy-flow.md#cover-photo`).
- **Not copied**: `CharacterPossession` rows (the copy starts unowned), history, a
  missing/not-ready cover and any non-cover `GamePossessionPhoto` row
  (`copy-flow.md#character-links-and-history`).
- **Photo**: a possession has at most one photo (the upload view facts above). Only a ready cover
  is copied, as one new `GamePossessionPhoto`, `ready=false`, at
  `photos/games/<target-slug>/possessions/<copy-id>/photo<ext>`. The path is built with segments
  `['games', <target-slug>, 'possessions', <copy-id>]`, the source extension, `use_uuid=False`
  and `root='photos'` (`hard-links.md#storage-roots`). The fixed path is safe because the copy
  id is new. The photo gets one copy-origin `Upload` (`upload_type=image`, `is_cover=true`), and
  `CopyLinkFinalizer` sets the copy's `photo` FK (`hard-links.md#finalize`). If there is no photo
  or the cover is not ready, there is no photo and no link.
- **Names**: clashes allowed, no unique constraint, never `422` (`copy-flow.md#names`).
- **API** (`copy-flow.md#api`):
  - `GET staff/copies/possessions.json?from=&to=`: paginated, ordered by `id`, lists
    **every** possession including hidden ones. Row table: `id`, `name`, `hidden`, `photo`
    (path only when the cover is ready, else null), `copied_to_target`.
  - `POST staff/copies/possessions/<id>.json` `{target}`: global responses. `links` has 0..1
    entry.
  - Pending-links query (`hard-links.md#pending-links-query`) via `game_possession__game`.
  - `copied_from` is never exposed.
- **Cache** (`permissions.md#cache`, every domain): copy `201` and cover finalize send
  `X-Cache-Clear` with:
  - the family from `GameResourceCachePaths('possessions', **FULL_FAMILY)`:
    `/games/<target>/possessions.json`, `.../possessions/all.json`,
    `.../possessions/<copy-id>.json`, `.../possessions/<copy-id>/full.json`;
  - `/games/<target>/{pcs,npcs}/<id>/possessions/available.json` for **every** PC and NPC of the
    target game, built from its characters at response time (`pcs` vs `npcs` by `npc`). The copy
    adds an entry to each of these lists. A hidden NPC's list is already `X-Skip-Cache`, but
    clearing it anyway is harmless. The `available/all.json` variants are never cached;
  - no character `possessions.json` lists: the copy has no owners.

  Note that the same gap in items/documents/factions is tracked in #1565.
- **Frontend** (`page.md#frontend-structure`): columns are checkbox, cover thumbnail
  (placeholder when null), name, hidden badge, and the "already copied" flag.
- **Testing**:
  - backend: fields copied and `game` = target; `photo` null at copy time; one `is_cover` link at
    the fixed path with the source extension for a ready cover; no link for no photo or a
    not-ready cover; a non-cover photo row is ignored; `CharacterPossession` not copied; name
    clash allowed; list rows (`photo` only when ready, hidden listed); finalize sets `photo`;
    pending-links via `game_possession__game`; `X-Cache-Clear` holds the family plus one
    `available.json` per target PC/NPC (none when the target has no characters).
  - frontend: row rendering (thumbnail, placeholder, hidden badge, "already copied").

### Step 2 — Link it from the index

In `docs/agents/specs/game-content-copy.md`, replace the plain `- Possessions — #1557` entry
with `- [Possessions](game-content-copy/possessions.md) — #1557`. If the "unlinked ones are
pending" remark is now obsolete (every tab is linked), drop that parenthetical.

## Files to Change

- `docs/agents/specs/game-content-copy/possessions.md`: new Possessions tab page.
- `docs/agents/specs/game-content-copy.md`: link the new page.

## CI Checks

- repo root: `docker-compose run --rm <node service> yarn lint_md`, or the equivalent `make`
  target (CI job: `markdownlint`).

## Notes

- Decided in the discussion: copy only the cover photo (the original text said "every
  `GamePossessionPhoto`"), and clear per-character available lists.
- The global pages don't mention per-character cache paths. The possessions page states them
  locally rather than editing `permissions.md`. #1565 may later move the rule into a shared
  place.
- No code changes, and no `access-control/staff-copy.md` change: the endpoints follow the
  existing global `staff/copies/<type>` pattern.
