# Plan: Add Character Item Photo Upload

Issue: [750-add-character-item-photo-upload.md](../issues/750-add-character-item-photo-upload.md)

## Overview

Wire up photo upload for `CharacterItem` (both PC and NPC). The model already has a nullable
`photo` FK and `CharacterItemPhoto` already exists (added in the item-list work, #658/#714/#724)
— nothing to build there. This plan adds a new PC/NPC item photo-upload init endpoint via the
existing shared PC/NPC view-factory pattern in `_character_shared.py` (fixed/deterministic
storage path, reuse-or-create photo row — `CharacterItem.photo` is a single override FK, not a
gallery), extends the shared `upload_finalize` view with a `CharacterItemPhoto` branch, exposes a
new `can_upload_item_photo` permissions field mirroring the existing `can_create_item` one, wires
the existing `PhotoUploadModal` into the shared `CharacterItem` detail page, and adds a proxy
cache-cleanup group to both `pcs.php` and `npcs.php` for the item routes.

**Depends on #749's frontend change** landing first: `ItemDetailHelper.render`'s signature gains
optional `canEdit`/`onUploadClick` params in #749 (defaulting to today's disabled behavior) —
this issue's frontend work assumes that signature already exists and just starts passing real
values from the `CharacterItem` callers instead of the `GameItem` caller. If #749 hasn't merged
yet when this is implemented, add that signature change here instead.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)

## Shared contracts

**New endpoints** — `POST /games/<slug:game_slug>/pcs/<int:character_id>/items/<int:item_id>/photo_upload.json`
and the `/npcs/` equivalent (auth required):
- Request body: `{"filename": "<string>"}` (validated by the existing `PhotoUploadSerializer`).
- Success `201`: `{"upload_id": <int>, "token": "<string>", "item_id": <int>}`.
- `401` unauthenticated; `403` authenticated but not permitted; `404` unknown `game_slug`,
  `character_id` (or wrong PC/NPC kind), or `item_id`; `400` missing/invalid `filename`.
- Frontend calls it exactly like the existing `PhotoUploadModal`/`UploadClient` flow — no new
  frontend upload logic, just a new `uploadPath` per PC/NPC item.

**Finalize step** — unchanged endpoint (`PATCH /uploads/<upload_id>.json`); backend internally
learns a new `CharacterItemPhoto` branch. Frontend needs no awareness of this branch.

**Authorization formula** (used identically by the new backend permission class and exposed via
the new `can_upload_item_photo` permissions field): a user may upload a character item's photo
iff `user.is_staff OR <that item's character>.can_be_edited_by(user)` — i.e. dm/admin/staff for
NPCs (no owner concept), plus the owning player for PCs. This is exactly
`CharacterItemCreatePermission`'s existing formula (`backend/games/permissions.py`), not
`CharacterPhotoUploadPermission`'s broader "any player of the game" one.

**Permissions field** — `.../permissions.json` (`CharacterPermissionsSerializer`) gains a new
`can_upload_item_photo` boolean, computed via the new permission class, for both the
real-identity and role-simulated (`?role=`) paths — a separate field from `can_create_item`, even
though both resolve identically today (per the issue discussion, so the two actions' rules can
diverge independently later).

**Cache-cleanup contract** (consumed by proxy, produced conceptually by backend's new routes) —
proxy adds one new cache-cleanup group to each of `pcs.php`/`npcs.php`, triggered by
`/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json` (and the `/npcs/`
equivalent), clearing:
- `/games/:game_slug/pcs/:character_id/items.json`
- `/games/:game_slug/pcs/:character_id/items/all.json`
- `/games/:game_slug/pcs/:character_id/items/:item_id.json`
- `/games/:game_slug/pcs/:character_id/items/:item_id/all.json`
- (same four paths under `/npcs/` for the NPC group)

This is a static proxy-side route-pattern mapping (see `pcs.php`'s existing treasures
acquire/sell group precedent) — no backend code change is required to make it work, only the new
routes existing.
