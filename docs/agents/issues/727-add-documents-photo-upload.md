# Issue: Add documents photo upload

## Description
Add photo support to `GameDocument`. The `photo` FK on `GameDocument` and its backing
`GameDocumentPhoto` model already exist as schema only (added in #758), so `photo_path` is
always `null` today. This issue wires up the missing upload/display/permission layer, following
the same multi-photo pattern already used for PC/NPC characters (a `GET .../photos` list, a
`POST .../photo_upload` upload endpoint, and a `PATCH .../photos/:id/set` display-photo
endpoint), reusing the existing generic `PhotoUploadModal`/`ActionsOverlay`/upload-saga
frontend components as-is.

## Problem
`GameDocument` has no way to add or manage photos: `photo_path` is always `null`, there is no
upload affordance on the document pages, and no endpoint exists to list a document's uploaded
photos or change which one is the current display photo.

## Expected Behavior
- A document can have multiple stored photos (`GameDocumentPhoto`, already related to
  `GameDocument` via `related_name='photos'`).
- One of those photos is the document's display photo (`GameDocument.photo`). The first photo
  ever uploaded for a document automatically becomes its display photo.
- The display photo is shown at the left of the page, with the document's name below it, on:
  - `/#/games/:game_slug/documents/new` (placeholder with an upload button)
  - `/#/games/:game_slug/documents/:id`
  - `/#/games/:game_slug/documents/:id/edit`
  - `/#/games/:game_slug/documents` (document card)
- A photo-upload affordance is available on:
  - `/#/games/:game_slug/documents/new` — deferred: the file is picked before the document
    exists, then uploaded right after creation succeeds (mirroring `GameItemNewController`)
  - `/#/games/:game_slug/documents/:id`
  - `/#/games/:game_slug/documents/:id/edit` — a new route/page added by this issue, since no
    document edit page or endpoint exists yet (issue #758 only added show + create); scoped
    only to the photo-upload affordance — no name/description/hidden editing, since
    `PATCH .../documents/:id.json` remains out of scope
- No dedicated "document photos" browsing page is added — a document's other stored photos
  beyond its current display photo are not browsable anywhere in this issue.

### New endpoints
- `GET /games/:game_slug/documents/:id/photos.json`
- `POST /games/:game_slug/documents/:id/photo_upload.json`
- `PATCH /games/:game_slug/documents/:document_id/photos/:id/set.json`

### Permissions
dm, player, and staff can use the new buttons and endpoints.

### Out of scope
- Photos for `CharacterDocument`
- A dedicated document-photos browsing page

## Solution
Mirror the existing PC/NPC character-photo implementation, adapted to the single-game-scoped
`GameDocument` resource (no PC/NPC split needed):
- Backend: add `game_document_photos` / `game_document_photo_upload` / `game_document_photo_set`
  views, paralleling `backend/games/views/game/_photos.py`, `_photo_upload.py`, and
  `_photo_set.py`.
- Permissions: a new `GameDocumentPhotoUploadPermission`, mirroring
  `GameItemPhotoUploadPermission`/`CharacterPhotoUploadPermission` (staff, any player of the
  game, or the game's dm/editor).
- Frontend: extend `DocumentPhoto.jsx` with `Edit`/`New` variants (mirroring `ItemPhoto.jsx`'s
  three-variant split), wire `PhotoUploadModal` into `GameDocument.jsx` and a new
  `GameDocumentEdit.jsx` the same way `GameItem.jsx`/`GameItemEdit.jsx` do, and add the
  deferred-upload flow to `GameDocumentNewController.js` (mirroring `GameItemNewController.js`),
  including a `DocumentNewPhotoUploadFailedAlert.jsx` retry/skip alert.
- `documentConfig.js` gains a `photoUploadInit` entry, mirroring `itemConfig.js`.

## Benefits
- Documents become visually identifiable, consistent with the existing item/character/treasure
  photo experience.
- Reuses fully generic shared components (`PhotoUploadModal`, `ActionsOverlay`, upload saga)
  as-is, with no changes needed to them.
