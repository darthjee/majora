# Issue: Add photo deletion

## Problem
There is currently no way to delete a photo once it has been uploaded to a PC or NPC. If a photo is uploaded by mistake (wrong file, wrong character, inappropriate content, etc.), it stays in the database and on the filesystem forever, with no cleanup path.

## Expected Behavior
- An admin, DM, or staff member viewing a PC/NPC's photos sees a "Delete Photo" action button (tooltip "Delete Photo", bootstrap `trash-fill` icon) on each photo. Regular players do not see this button.
- Clicking the button opens a confirmation modal.
  - Cancel closes the modal with no changes.
  - Submit proceeds with deletion.
- On submit, the photo is marked not-ready (hidden from normal listing) and then permanently deleted: its database record is removed and its file is removed from the filesystem.
- If the deleted photo was set as the character's profile photo, the profile photo reference is cleared.

## Solution
Add a photo deletion flow that piggybacks on the existing photo-upload pattern (proxy orchestration handler + backend requests), starting with PC and NPC photos.

### Security
Only admin, DM, and staff may delete a photo — three distinct roles: Django superuser (admin), Django `is_staff` (staff), and the game's per-game DM (dm). This is stricter than the existing `CharacterPhotoUploadPermission` used for upload/set (which also allows any player of the game) — delete needs its own, narrower permission class that checks all three.

### UI Flow
- Action button shown for dm/staff/admin only (tooltip "Delete Photo", icon `trash-fill`).
- Clicking opens a confirmation modal (Cancel closes it, Submit proceeds).
- Submit triggers:
  1. `PATCH /.../photos/:id.json` with `{ready: false}`
  2. `DELETE /.../photos/:id.json`

### Proxy
- New dedicated DELETE rule, added to both `proxy/prod_configuration/rules/` and `proxy/dev_configuration/rules/` (mirrored, like `uploads.php` is today), matching `DELETE /.../photos/:id.json`.
- New request handler (similar to `UploadHandler`) that:
  1. Calls `GET .../photos/:id/deletable.json` — 404 if not found, 422 if not deletable.
  2. Deletes the file at the `path` returned by that call.
  3. Calls the backend `DELETE .../photos/:id.json`.

### New backend endpoints (PC and NPC)
- `GET /games/:game_slug/{pcs,npcs}/:id/photos/:photo_id/deletable.json`
  - Ignores character hidden state (still checks game access if user is dm).
  - Sends `X-Skip-Cache` so the check always reflects live state, not a cached response.
  - 404 if photo not found; 422 if photo is not `ready: false`; `{deletable: true, path: ...}` otherwise.
- `PATCH /games/:game_slug/{pcs,npcs}/:id/photos/:photo_id.json`
  - Updates the photo's `ready` status only.
  - Clears the PC/NPC cache (`cache_cleanup/pcs.php` / `npcs.php`).
  - If marking not-ready and the photo is the character's profile photo, clears that reference.
- `DELETE /games/:game_slug/{pcs,npcs}/:id/photos/:photo_id.json`
  - Ignores character hidden state; still checks the requester is the game's DM (or admin/staff).
  - 422 if photo is not `ready: false`.
  - Deletes the photo record.
  - No cache cleanup needed here: the photo is already excluded from cached listings once `ready: false` (cleared by the preceding PATCH).

### Permissions
All new endpoints and the delete button: admin, dm, staff only.

### Prototype scope
Backend endpoints and pages for PC and NPC photos only:
- `GET .../pcs/:id/photos/:photo_id/deletable.json`, `GET .../npcs/:id/photos/:photo_id/deletable.json`
- `PATCH .../pcs/:id/photos/:photo_id.json`, `PATCH .../npcs/:id/photos/:photo_id.json`
- `DELETE .../pcs/:id/photos/:photo_id.json`, `DELETE .../npcs/:id/photos/:photo_id.json`
- Pages: `/#/games/:game_slug/pcs/:id/photos`, `/#/games/:game_slug/npcs/:id/photos`

## Benefits
- Admin/DM/staff can clean up wrongly-uploaded photos instead of them lingering forever.
- Keeps the database and filesystem free of unwanted/orphaned image files.
