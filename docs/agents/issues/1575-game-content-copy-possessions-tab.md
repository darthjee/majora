# Issue: Game content copy: Possessions tab

## Description
Part of "copy content between games" (epic #1550): the **Possessions** tab.

Design source of truth: the specs under `docs/agents/specs/game-content-copy/` (index `docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win. This issue implements `possessions.md` on top of the global pages (`copy-flow.md`, `hard-links.md`, `permissions.md`, `page.md`).

`GamePossession` is copied like an item: `name`, `description`, `hidden`, name clashes allowed. Like a faction, it has a single fixed-path cover photo. The copy also adds an entry to every target character's list of available possessions.

The shared infrastructure is already merged: the generic dispatch, `ModelCopyType`, `CoverPhotoLinkBuilder`, the copy-link registry, `GameCharactersAvailableCachePaths` and the copy page. The Items tab (#1572 / #1583) is the reference pattern, and this tab is very close to it. Already in place: the `copied_from` field on `GamePossession` (migration `0105_copied_from`), and the `CoverCopyLink(GamePossessionPhoto, 'game_possession')` registry entry in `backend/staff/copy_links.py`, which has no cache paths yet.

## Expected Behavior
### Backend
- A new `PossessionsCopyType` (`backend/staff/copy_types_possessions.py`), modelled on `ItemsCopyType`:
  - slug `possessions`, model `GamePossession`, `copied_fields = ('name', 'description', 'hidden')`;
  - `source_queryset` preloads `photo`, lists **every** possession of the source game (hidden ones included), ordered by `id`;
  - `copy_associations` uses `CoverPhotoLinkBuilder('game_possession', ...)` with segments `['games', <target-slug>, 'possessions', <copy-id>]`. The target path is `photos/games/<target-slug>/possessions/<copy-id>/photo<ext>`, keeping the source extension;
  - only the source's cover `photo` is copied, and only when `ready=true`. A missing or not-ready cover gives no link, and the copy's `photo` stays null. Non-cover `GamePossessionPhoto` rows are ignored;
  - `CharacterPossession` rows and the history are not copied.
- Registered in `COPY_TYPES` (`backend/staff/copy_types.py`) at its spec tab position, **last**: after `items`, `common_items`, `recipes`, and after `documents`/`factions` whenever those land.
- A list row serializer `StaffCopyPossessionSerializer` with `id`, `name`, `hidden`, `photo` (cover path only when ready, else null) and `copied_to_target`. `copied_from` itself is never exposed.
- `GET staff/copies/possessions.json?from=&to=` and `POST staff/copies/possessions/<id>.json {target}` work through the generic dispatch. They use the global responses, and `links` holds 0 or 1 entry (the cover).
- Pending-links query: a `GamePossessionPhoto` reaches its game through `game_possession__game`. The registry entry already covers this; it is verified by tests.

### Cache (`X-Cache-Clear`, cleared on every domain)
On the copy `201` **and** on the cover link's finalize (by adding `cache_paths` to the existing `CoverCopyLink(GamePossessionPhoto, ...)` entry):
- the target's possession family, built by reusing `GameResourceCachePaths('possessions', **FULL_FAMILY)` / `photo_types.find('game_possession')`:
  - `/games/<target>/possessions.json`
  - `/games/<target>/possessions/all.json`
  - `/games/<target>/possessions/<copy-id>.json`
  - `/games/<target>/possessions/<copy-id>/full.json`
- `/games/<target>/{pcs|npcs}/<id>/possessions/available.json`, one per character of the target game (`GameCharactersAvailableCachePaths('possessions')`), hidden NPCs included. A target with no characters adds no such path.
- Implemented as `possessions_copy_cache_paths` in `backend/staff/copy_cache_paths.py`, shared by the copy type and the link finalize, like `items_copy_cache_paths`.
- Nothing else is cleared: the `possessions/available/all.json` variants send `X-Skip-Cache`, and no character's `possessions.json` changes.

### Frontend
- `StaffCopyPossessionRow.jsx` under `staff_copy/pages/elements/rows/`, wired into the tab, with these columns:
  1. checkbox
  2. cover thumbnail, or a placeholder when `photo` is null
  3. name
  4. hidden badge, when `hidden`
  5. "already copied" flag, when `copied_to_target`
- i18n keys (en + pt) for the tab label or anything else it needs, following the Items/Common items rows.

## Solution
- Agents: `backend` and `frontend`, plus `translator` for new keys. Reviews: `data-access` and `security`. `cache` confirms the `X-Cache-Clear` paths and that no Navi resource is needed.
- Reuse, don't duplicate: `ModelCopyType`, `CoverPhotoLinkBuilder`, `GameResourceCachePaths`/`photo_types`, `GameCharactersAvailableCachePaths`, and the existing row components (`StaffCopyItemRow`, `StaffCopyHiddenBadge`, `StaffCopyRowStatus`).

### Tests (per `possessions.md` "Testing")
- **backend**:
  - `name`/`description`/`hidden`/`copied_from` copied, and `game` set to the target;
  - `photo` null at copy time;
  - one link with `is_cover=true` for a ready cover, at the fixed `photo<ext>` path with the source extension;
  - no link when there is no photo or the cover is not ready;
  - a non-cover `GamePossessionPhoto` is ignored;
  - `CharacterPossession` rows not copied;
  - name clash allowed;
  - list row fields (`photo` only when ready), and hidden possessions listed;
  - cover finalize sets the copy's `photo`;
  - pending-links query reaches the game through `game_possession__game`;
  - `X-Cache-Clear` on both the `201` and the finalize holds the family plus one `possessions/available.json` per target PC and NPC, and only the family when the target has no characters.
- **frontend**: row rendering, covering the thumbnail, placeholder, hidden badge and "already copied" flag.

### Depends on
The Items tab (#1572), already merged in #1583, is the reference per-tab pattern.

## Benefits
Staff can copy Possessions, with their cover photo, between games, and the target game's possession lists and every character's available-possessions list are refreshed in the cache.
