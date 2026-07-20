# Plan: Add Game Item photo upload

Issue: [749-add-game-item-photo-upload.md](../issues/749-add-game-item-photo-upload.md)

## Overview

Wire up photo upload for `GameItem`. The `GameItem`/`GameItemPhoto` models already exist
(added in the item-list work, #658/#714/#724) but no endpoint, permission, or UI ever touches
them. This plan adds a new init endpoint mirroring `treasure_photo_upload` (fixed/deterministic
storage path, reuse-or-create photo row — `GameItem.photo` is a single FK like
`Treasure.photo`, not a gallery), extends the shared `upload_finalize` view with a
`GameItemPhoto` branch, wires the existing `PhotoUploadModal` into the item detail page
(replacing its current disabled stub), and adds a proxy cache-cleanup config for the item
list/detail routes — the one piece of infrastructure genuinely missing (`pcs.php`/`npcs.php`
already exist; `items.php` does not).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)

## Shared contracts

**New endpoint** — `POST /games/<slug:game_slug>/items/<int:item_id>/photo_upload.json`
(auth required):
- Request body: `{"filename": "<string>"}` (validated by the existing
  `PhotoUploadSerializer` — extension allow-list `.jpg/.jpeg/.png/.webp/.gif`).
- Success `201`: `{"upload_id": <int>, "token": "<string>", "item_id": <int>}`.
- `401` unauthenticated; `403` authenticated but not permitted; `404` unknown `game_slug` or
  `item_id`; `400` missing/invalid `filename`.
- Frontend calls it exactly like the existing `PhotoUploadModal`/`UploadClient` flow for
  Treasure/Character — no new frontend upload logic, just a new `uploadPath`.

**Finalize step** — unchanged endpoint (`PATCH /uploads/<upload_id>.json`), used as-is by the
frontend; backend internally learns a new `GameItemPhoto` branch so the existing generic flow
works for items too. Frontend needs no awareness of this branch.

**Authorization formula** (used identically by the new backend permission class and the
frontend's local gate — see `## Shared contracts` in `frontend.md`): a user may upload an item
photo iff `user.is_superuser OR user.is_staff OR <that item's game>.can_be_edited_by(user)
[i.e. is_dm] OR <that item's game>.has_player(user)`. This is the same shape as
`CharacterPhotoUploadPermission`, checked against the item's `game` directly instead of via a
character.

**Cache-cleanup contract** (consumed by proxy, produced conceptually by backend's new route)
— proxy adds a cache-cleanup group triggered by
`/games/:game_slug/items/:item_id/photo_upload.json` that clears:
- `/games/:game_slug/items.json`
- `/games/:game_slug/items/all.json`
- `/games/:game_slug/items/:item_id.json`
- `/games/:game_slug/items/:item_id/all.json`

This is a static proxy-side route-pattern mapping (see `pcs.php`/`npcs.php` precedent) — no
backend code change is required to make it work, only the new route existing.
