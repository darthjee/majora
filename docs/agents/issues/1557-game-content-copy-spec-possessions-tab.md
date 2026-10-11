# Issue: Game content copy spec: Possessions tab

## Description

Part of the "copy content between games" epic (#1550). Write the **Possessions** tab page of the
spec, `docs/agents/specs/game-content-copy/possessions.md`, following the same structure as the
already-written tab pages (`items.md`, `common-items.md`, `recipes.md`, `documents.md`,
`factions.md`).

The shared rules (page, copy flow, `copied_from`, `hidden` kept, cover photo, `Upload` link kind,
proxy link endpoint, pending/failed links, permissions, cache) live in the global pages
(`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`). The possessions page must
reference them, not repeat them, and only add what is specific to possessions.

## Problem

`GamePossession` mixes traits of two already-specified types, which the global pages do not
spell out:

- like `GameItem`, it has `name`, `description`, `hidden` and a cover `photo` FK, and name
  clashes in the target game are allowed;
- like `GameFaction`, its photo upload (`game_possession_photo_upload`) uses a **fixed,
  deterministic** path (`photos/games/<slug>/possessions/<id>/photo<ext>`, `use_uuid=False`) and
  reuses/replaces a single `GamePossessionPhoto`, so in practice a possession has at most one
  photo — its cover. Copying "every `GamePossessionPhoto`" (as the original issue text said)
  would collide on that fixed target path;
- its ownership rows (`CharacterPossession`) are character-scoped and never copied.

Without a dedicated page, the implementation (#1558) has no precise contract for these points.

## Expected Behavior

`docs/agents/specs/game-content-copy/possessions.md` exists, follows the structure of
`items.md`/`factions.md` (Model, Copied fields, Not copied, Photo, Names, API, Cache, Frontend,
Testing), and covers, for the `possessions` tab:

- **Model**: `GamePossession` (`backend/games/models/game/game_possession.py`: `game`, `name`,
  `description`, `hidden`, cover `photo` FK → `GamePossessionPhoto` `SET_NULL`,
  `related_name='+'`, simple-history) and `GamePossessionPhoto` (`BasePhoto`, `game_possession`
  FK, `related_name='photos'`).
- **Copied fields**: `name`, `description`, `hidden` (source values), `game` (target),
  `copied_from` (source), `photo` (null at copy time, set by the cover link's finalize).
- **Not copied**: `CharacterPossession` rows (the copy starts unowned), the source's history,
  a missing/not-ready cover, and any non-cover `GamePossessionPhoto` row.
- **Photo**: only the source's **cover** `photo`, when `ready=true`, is copied — as one new
  `GamePossessionPhoto`, `ready=false`, at the fixed path built like
  `game_possession_photo_upload` (`PhotoPathBuilder` segments
  `['games', <target-slug>, 'possessions', <copy-id>]`, name `photo<ext>` with the source
  extension, `use_uuid=False`) — i.e. `photos/games/<target-slug>/possessions/<copy-id>/photo<ext>`
  — with one copy-origin `Upload` (`upload_type=image`, `is_cover=true`) whose finalize
  (`CopyLinkFinalizer`) sets the copy's `photo` FK. No photo / not-ready cover → no link.
- **Names**: clashes in the target game are allowed (no unique constraint, no `422`).
- **API**: `GET staff/copies/possessions.json?from=&to=` row fields (`id`, `name`, `hidden`,
  `photo` only when ready, `copied_to_target`; hidden possessions listed) and
  `POST staff/copies/possessions/<id>.json` `{target}` (`links` with 0..1 entries); the
  pending-links query reaches the game through `game_possession__game`.
- **Cache**: `X-Cache-Clear` paths for the target's possession family, reusing
  `GameResourceCachePaths('possessions', **FULL_FAMILY)` (same family as the staff photo type
  `game_possession` in `backend/staff/photo_types.py`):
  `/games/<target>/possessions.json`, `.../possessions/all.json`,
  `.../possessions/<copy-id>.json`, `.../possessions/<copy-id>/full.json`. They also clear
  `/games/<target>/{pcs,npcs}/<id>/possessions/available.json` for **every** PC and NPC of the
  target game, since the copy adds an entry to each of those cached lists (only a hidden NPC's
  list is `X-Skip-Cache`, and clearing it anyway is harmless). The `available/all.json` variants
  are always `X-Skip-Cache`, so they need nothing. The paths are built from the target game's
  characters at response time and cleared on every domain (`permissions.md#cache`).
- **Frontend**: tab-specific row columns (checkbox, cover thumbnail/placeholder, name, hidden
  badge, "already copied" flag).
- **Testing**: per-type backend and frontend cases, including the per-character
  `possessions/available.json` paths in `X-Cache-Clear`.

The index `docs/agents/specs/game-content-copy.md` links the new page (replacing the plain
"Possessions — #1557" entry). No code changes.

## Solution

Spec-only change, owned by `architect`: add `possessions.md` and update the index link.
Decisions made in the discussion:

- Cover-only photo copy (at most one photo, fixed path), consistent with `items.md` and
  `factions.md`, instead of "every `GamePossessionPhoto`".
- Copy and finalize also clear every target character's cached `possessions/available.json`.
  The same gap in the items, documents and factions pages is tracked separately in #1565.

## Benefits

- Unblocks the Possessions part of the implementation (#1558) with no guesswork about the
  single fixed-path photo and character ownership.
- Completes the set of tab pages, keeping them consistent and the global rules in one place.
