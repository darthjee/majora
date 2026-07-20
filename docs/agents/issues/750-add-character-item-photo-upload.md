# Issue: Add Character Item Photo Upload

## Description
Add photo upload for `CharacterItem` — the per-character override row linking a `Character`
(PC or NPC) to a `GameItem`. This completes the item feature (#658/#714/#724) and mirrors the
`GameItem` photo upload work (#749), narrowed to the character-owned override instead of the
game's catalog entry. Depends on #479, which is already closed/merged — no longer a blocker.

## Problem
`CharacterItem` already has a nullable `photo` FK (`backend/games/models/character/character_item.py`)
that overrides the linked `GameItem`'s photo when set, and a dedicated `CharacterItemPhoto`
model already exists (`backend/games/models/character/character_item_photo.py`) — but no
endpoint, permission, or UI ever sets it. The item detail page's photo overlay
(`ItemDetailHelper`, shared by `GameItem`/`PcCharacterItem`/`NpcCharacterItem`) is currently
rendered with upload permanently disabled (`canEdit={false}`, `onClick={Noop.noop}`).

## Expected Behavior
A user permitted to edit a PC or NPC's item (dm, admin/superuser, staff, or — PC only — that
item's owning player) sees a photo-upload button on that item's detail page, opens the shared
upload modal, and on success the item's photo is replaced immediately (existing photo, if any,
is always overwritten — never a gallery). The item's `photo_path` (already exposed via
`CharacterItemSerializer`, with fallback to the linked `GameItem`'s photo when the character
item has none of its own) reflects the new photo right away, and the relevant PC/NPC item list
and detail caches are cleared on the proxy.

## Solution

### Corrections to the proposed flow
- **No new entity needed.** `CharacterItemPhoto` already exists
  (`backend/games/models/character/character_item_photo.py`), FK'd from `character_item`
  (`related_name='photos'`) — nothing to create there.
- **Real upload flow** is the shared two-step flow already used by every other photo (not a
  single `POST /uploads/:id/photo_upload`):
  1. `POST /games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json` (and the
     `/npcs/` equivalent) — new init endpoint, returns `{upload_id, token, item_id}` on `201`.
  2. Proxy-handled multipart `POST /uploads/:upload_id/submit` (unchanged, generic).
  3. `PATCH /uploads/:upload_id.json` finalize (unchanged endpoint) — backend internally learns
     a new `CharacterItemPhoto` branch so the existing generic flow covers character items too.
- **Storage path is fixed/deterministic, not hash-randomized.** `CharacterItem.photo` is a
  single nullable FK (an override slot), the same shape as `GameItem.photo`/`Treasure.photo` —
  not a gallery like `Character.photo` (which does use a randomized-filename, always-new-row
  pattern). So each upload reuses (or creates once) the same `CharacterItemPhoto` row, at:
  - PC: `photos/games/<game_slug>/pcs/<character_id>/items/<item_id>/photo.<ext>`
  - NPC: `photos/games/<game_slug>/npcs/<character_id>/items/<item_id>/photo.<ext>`
- **Authorization matches the existing item-creation rule exactly**, not the character's own
  (broader, player-inclusive) photo-upload rule. The issue's own "admin, owner, staff and dm"
  wording is precisely `CharacterItemCreatePermission` (`backend/games/permissions.py`):
  `user.is_staff or character.can_be_edited_by(user)` — which already resolves to dm/admin/staff
  for NPCs (no owner concept) and dm/admin/staff/owner for PCs. A new
  `CharacterItemPhotoUploadPermission` should mirror it (not `CharacterPhotoUploadPermission`,
  which additionally grants any player of the game — too broad here).
- **Cache-clear target lists expand from 2 to 4 per kind**, matching the item resource's actual
  four existing endpoints (list, list-all, detail, detail-all) — mirroring the expansion already
  made for `GameItem` in #749:
  - PC: `/games/:game_slug/pcs/:character_id/items.json`,
    `/games/:game_slug/pcs/:character_id/items/all.json`,
    `/games/:game_slug/pcs/:character_id/items/:item_id.json`,
    `/games/:game_slug/pcs/:character_id/items/:item_id/all.json`
  - NPC: same four paths under `/npcs/`.

### Backend
- New `CharacterItemPhotoUploadPermission`, mirroring `CharacterItemCreatePermission`.
- New PC/NPC item photo-upload init views, following the existing shared-factory pattern in
  `backend/games/views/game/_character_shared.py` (`build_photo_upload_view` for the
  character-level equivalent) plus a new `/items/<int:item_id>/photo_upload.json` route added
  to `backend/games/urls/_character_routes.py`'s shared `_CHARACTER_ROUTES` list, so both PC and
  NPC get it for free.
- Extend `backend/games/views/upload_finalize.py` with a `CharacterItemPhoto` branch in both
  `_check_permission` and `_mark_content_object_ready` (unconditionally replacing
  `character_item.photo`, like `Treasure`/`GameItem`, not "if unset" like `Character`).
- Add a new `can_upload_item_photo` boolean to `CharacterPermissionsSerializer`
  (`.../permissions.json`), computed via `CharacterItemPhotoUploadPermission` for both the
  real-identity and role-simulated (`?role=`) paths — deliberately a separate field from
  `can_create_item`, even though both resolve identically today, so the two actions' rules can
  diverge independently in the future.
- Update `docs/agents/access-control/character-item.md`, which currently lists photo upload as
  "left for follow-up issues" — this is that follow-up.

### Frontend
- Wire the existing `PhotoUploadModal` into the shared `CharacterItem` detail page
  (`frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx`), the
  same disabled `ItemDetailHelper` overlay `GameItem` already uses — enabling it for the
  `CharacterItem` callers this time (GameItem's own enablement, #749, deliberately left these
  callers untouched).
- Gate the upload button on the new `can_upload_item_photo` permission field, fetched via
  `AccessStore.ensureCharacterPermissions` (already called in `CharacterItemDetailController`
  for `can_edit`) — read the new field from that same response, no extra network call needed.

### Proxy
- Add a new cache-cleanup group to both `proxy/extension/lib/configuration/cache_cleanup/pcs.php`
  and `.../npcs.php` (alongside their existing "treasures acquire/sell" groups), triggered by
  each kind's new `items/:item_id/photo_upload.json` route, clearing the four item targets above.

### Out of scope
- No update/delete endpoint for a `CharacterItem` row, and no way to link an already-existing
  `GameItem` instead of creating a new one — both already out of scope per
  `character-item.md`, unrelated to photo upload.
- `GameItem`'s own catalog photo is #749, a separate issue/entity.

## Benefits
- Completes the item feature (#658/#714/#724): character-owned item overrides can finally get
  their own photo, not just an inherited one from the game catalog.
- Reuses the existing upload plumbing end to end (`UploadInitiator`, `upload_finalize`,
  `PhotoUploadModal`, the proxy multipart handler, the shared PC/NPC view-factory pattern,
  the cache-cleanup config pattern) — no new infrastructure, only the missing wiring.
