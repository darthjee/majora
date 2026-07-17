# Issue: Allow players and staff to upload PC photos

## Problem
On a PC (player character) page, photo upload is currently gated by the same permission that governs full PC editing (`CharacterEditPermission` / `Character.can_be_edited_by`). Today that only allows: the game's superuser, the DM, and the PC's own assigned player (its "owner"). Django `is_staff` users and any other player of the game (someone who isn't the PC's own owner) get a 403 when trying to upload a PC photo.

This mirrors an existing pattern already used for NPC photo uploads: any player of the game can already upload an NPC's photo (`NpcPlayerEditPermission`), but that same leniency was never extended to PCs.

## Expected behavior
For the PC photo-upload action specifically (not full PC editing), all of the following should be allowed:
- admin (superuser) — already allowed today
- dm — already allowed today
- staff (any Django `is_staff` user, globally — same tier as superuser, not scoped to games they're already involved in)
- owner (the PC's own assigned player) — already allowed today
- player (any player of the game, not just the PC's own owner) — new

## Solution
- In `/#/games/:game_slug/pcs/:id`, the photo upload button and modal should be visible/accessible to users with any of the roles listed above.
- `POST /games/:game_slug/pcs/:id/photo_upload` should accept requests from users with any of the roles listed above.
- This change is scoped to photo upload only. Full PC editing (name, description, other fields) keeps using the existing, stricter permission (`CharacterEditPermission`) and is not affected.
- The backend fix likely involves introducing a photo-upload-specific permission for PCs (mirroring `NpcPlayerEditPermission`, which already allows any player of the game) rather than broadening `CharacterEditPermission` itself, plus adding an `is_staff` bypass. The frontend gating in `CharacterAvatarHelper.jsx` / `CharacterPhotos.jsx` (currently keyed off `character.can_edit` for PCs) needs a similar photo-upload-specific check rather than the general edit permission.

## Roles permitted
- admin (superuser)
- dm
- staff (Django is_staff, global)
- owner (the PC's assigned player)
- player (any player of the game)
