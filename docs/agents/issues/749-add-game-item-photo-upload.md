# Issue: Add Game Item photo upload

## Description
Add photo upload support for `GameItem` (a magic item belonging to a game), following the
same init → proxy-multipart-submit → finalize flow already used for `Treasure` and
`Character` photos. The `GameItem`/`GameItemPhoto` models already exist (added in the same
migration as `CharacterItem`/`CharacterItemPhoto`, alongside the item-list endpoints from
#658/#714/#724) but are not yet wired to any upload endpoint — this issue adds that wiring.

## Problem
There is currently no way to attach a photo to a `GameItem`. `GameItem.photo_path` is already
exposed by the item list/detail endpoints (falling back to `null`), and `CharacterItem`
already inherits `photo_path` from its linked `GameItem` when its own override is unset — but
nothing can ever set it. Both `docs/agents/access-control/game-item.md` and
`character-item.md` explicitly deferred "photo upload" to a follow-up issue; this is that
issue, scoped to `GameItem` only (`CharacterItem`'s own photo override stays out of scope, for
a later issue).

## Expected Behavior
- The item detail page's photo overlay (`ItemDetailHelper.jsx`, currently hardcoded
  `canEdit={false}` / `onClick={Noop.noop}`) becomes clickable for authorized users, opening
  the shared `PhotoUploadModal`, mirroring how `CharacterDetail.jsx`/`GameEditHelper.jsx`
  already wire it up.
- Uploading a photo follows the existing two-step flow, not the flow guessed in the original
  issue text:
  1. `POST /games/:game_slug/items/:item_id/photo_upload.json` — init, returns
     `{upload_id, token, item_id}`.
  2. Proxy-handled multipart `POST /uploads/:upload_id/submit` (unchanged, generic), which
     internally calls `PATCH /uploads/:upload_id.json` twice (`status=uploading`, then
     `status=uploaded`) — not `POST /uploads/:id/photo_upload` as originally guessed.
- On finalize, `GameItem.photo` is unconditionally set to the new `GameItemPhoto` — like
  `Treasure`, a `GameItem` has at most one photo, always replaced on re-upload (no "only if
  unset" guard, unlike `Game`/`Character`).
- `game/:game_slug/items.json`, `.../items/all.json`, `.../items/:item_id.json`, and
  `.../items/:item_id/all.json` proxy caches are purged when a photo is uploaded for that item.

## Solution
**Backend:**
- New `GameItemPhotoUploadPermission` (mirroring `CharacterPhotoUploadPermission`): allows the
  item's game's GameMaster/superuser (`game.can_be_edited_by`), any player of that game
  (`game.has_player`), or global staff (`user.is_staff`) — matching "admin, player, staff and
  dm" from the original issue text.
- New view `POST /games/:game_slug/items/:item_id/photo_upload.json`, shaped like
  `treasure_photo_upload` (permission check → `UploadInitiator`).
- Storage path: fixed and deterministic, matching `Treasure`'s pattern (not `Character`'s
  randomized/gallery one) since `GameItem.photo` is a single FK, not a gallery —
  `photos/games/<game_slug>/items/<item_id>/photo.<ext>`. Re-uploading reuses the existing
  `GameItemPhoto` row (`path` updated, `ready` reset to `False`) instead of creating a new one,
  exactly like `_reuse_or_create_photo` in `treasure_photo_upload.py`.
- Extend `upload_finalize`'s `isinstance` branches (`_check_permission` and
  `_mark_content_object_ready`) with a `GameItemPhoto` case: permission via
  `GameItemPhotoUploadPermission` against `content_object.game_item.game`, and unconditionally
  set `GameItem.photo` (no "if unset" guard).
- New `GameItemPhotoSerializer` (`id`, `path`), mirroring `TreasurePhotoSerializer` /
  `CharacterPhotoSerializer`, for parity even though `photo_path` is already resolved
  server-side on the existing item serializers.

**Frontend:**
- Wire `PhotoUploadModal` and a real click handler into the item detail page/container,
  replacing `ItemDetailHelper.jsx`'s current `canEdit={false}` / `Noop.noop` stub.
- `uploadPath` = `/games/${gameSlug}/items/${item.id}/photo_upload.json`.
- `canEdit` sourced from the same permission the backend now enforces — reusing the parent
  game's own `access.json`/`permissions.json` data (already available on the game-scoped item
  page) rather than adding a new per-item field.

**Proxy:**
- New `proxy/extension/lib/configuration/cache_cleanup/items.php`, registered in
  `cache_cleanup_map.php`, mirroring `pcs.php`/`npcs.php`: `targets` = the four item
  list/detail paths above, `routes` = `/games/:game_slug/items/:item_id/photo_upload.json`.

**Out of scope:** `CharacterItem`'s own photo override upload (equally-unwired
`CharacterItemPhoto` model) — left for a follow-up issue.

## Benefits
- Item photos become visible via the same catalog/detail endpoints that already expose
  `photo_path`, completing the item feature started in #658/#714/#724.
- Reuses the existing upload plumbing end to end (`UploadInitiator`, `upload_finalize`,
  `PhotoUploadModal`, the proxy multipart handler, the cache-cleanup config pattern) — no new
  infrastructure, only the missing wiring for this one resource.
