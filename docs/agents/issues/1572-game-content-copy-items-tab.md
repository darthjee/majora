# Issue: Game content copy: Items tab

## Description
Part of "copy content between games" (epic #1550): the **Items** tab. It is the **reference implementation** of the per-tab pattern that the other tabs (#1573–#1577) follow.

Design source of truth: the specs under `docs/agents/specs/game-content-copy/` (index `docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win. Implements `items.md` on top of the global pages (`copy-flow.md`, `hard-links.md`, `permissions.md`, `page.md`).

## Problem
The shared copy machinery is merged (#1568 backend foundation, #1569 `Upload` copy origin, #1570 proxy link handler, #1571 staff copy page), but every per-type plug point still ships empty:
- `backend/staff/copy_types.py` `COPY_TYPES` is `()`, so `GET staff/copies.json` returns no tabs and `staff/copies/items*` rejects the slug.
- `backend/staff/copy_links.py` already has `CoverCopyLink(GameItemPhoto, 'game_item')` (finalize sets the cover, pending-links reach through `game_item__game`), but its `cache_paths` hook returns `[]`.
- The frontend `StaffCopyRows` registry is empty, so items would render with the generic fallback row.

## Expected Behavior
- **Registry**: an `items` `CopyType` for `GameItem`, inserted **first** in `COPY_TYPES` (the spec tab order), implementing `list` and `copy`.
- **List**: `GET staff/copies/items.json?from=&to=`, paginated, ordered by `id`, every item of the source game (hidden included), row fields `id`, `name`, `hidden`, `photo` (cover path only when `ready`, else null), `copied_to_target`. `copied_from` is never exposed.
- **Copy**: `POST staff/copies/items/<id>.json {target}` in one transaction: `name`, `description`, `hidden` copied, `game` = target, `copied_from` = source, `photo` null. When the source cover `photo` is `ready`, one `GameItemPhoto` row (`ready=false`, `photos/games/<target-slug>/items/<copy-id>/photo<ext>`, source extension) plus one copy-origin `Upload` (`upload_type=image`, `is_cover=true`); returns `201 {id, links}` with 0 or 1 link. Not copied: other `GameItemPhoto` rows, `CharacterItem` rows and their photos, history. Name clashes allowed (no `422`).
- **Cache**: `X-Cache-Clear` on the copy `201` and on the cover link finalize (via the `GameItemPhoto` entry `cache_paths` hook), cleared on every domain: the target item family (`GameResourceCachePaths('items', **FULL_FAMILY)`) plus `/games/<target>/<pcs|npcs>/<id>/items/available.json` for every character of the target game; only the family when it has none.
- **Shared helpers** (reference implementation): the pieces every tab repeats are built generically, outside the items entry, so #1573–#1577 only declare their model, copied fields, photo path and cache family:
  - `CopyType` list/copy scaffolding: paginated source list ordered by `id` with the `copied_to_target` annotation, and the transactional copy that sets `game`/`copied_from` and returns `201 {id, links}`;
  - a cover-photo link builder: given a ready source cover, creates the copy photo row (`ready=false`, `root='photos'`, extension kept) and its copy-origin `Upload`, and returns the link entry;
  - a cache-path helper for every target character's `<pcs|npcs>/<id>/<family>/available.json`, reusable by tabs whose spec lists those paths.
  Each helper has its own unit tests; the items entry is their first caller.
- **Frontend**: an items row component registered in `StaffCopyRows` for `items`, rendering cover thumbnail (placeholder when `photo` is null), name and hidden badge; the checkbox and "already copied" cells are already rendered by the shared source list. New i18n keys (en + pt) for the column headers / hidden badge only — the `items` tab label already exists.

## Solution
- Agents: `backend`, `frontend`, `translator`. Reviews: `data-access`, `security`; `cache` confirms the `X-Cache-Clear` paths and that no Navi resource is needed (staff endpoints).
- Tests: the per-type cases in `items.md` "Testing" (backend: copied fields, link/no-link cases, ignored non-cover photo, `CharacterItem` not copied, name clash, list rows, finalize sets `photo`, pending-links reach, cache paths with and without characters; frontend: thumbnail, placeholder, hidden badge).

### Depends on
#1568, #1569, #1570, #1571 — all merged.

## Benefits
Staff can copy Items between games, and the next tabs have a concrete pattern to follow.
