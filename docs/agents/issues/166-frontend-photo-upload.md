# Issue: Add frontend for Photo Upload

## Description
Add frontend UI for the game photo upload flow on the game edit page: an "Upload Photo" button, a modal for file selection, and client logic to orchestrate the two-step upload.

## Problem
The game edit page (`/#/games/:game_slug/edit`) currently only supports URL-based photos. There is no UI for uploading actual image files.

## Expected Behavior
- The game edit page shows an "Upload Photo" button
- Clicking it opens a modal with both a drag-and-drop area and a file picker
- On submit:
  1. Frontend calls `POST /games/:game_slug/photo_upload.json` with the filename → receives `{ id, token }`
  2. Frontend calls `PATCH /uploads/:id/submit` to the proxy with the image file and token
  3. Modal closes on success; on failure, modal shows an error and stays open; the game edit page does not refresh

## Solution
**New modal component** (following the `LoginModal` pattern — component + controller + helper):
- `frontend/assets/js/components/elements/PhotoUploadModal.jsx`
- `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js`
- `frontend/assets/js/components/elements/helpers/PhotoUploadModalHelper.jsx`
- Modal body contains a drag-and-drop drop zone and an `<input type="file">` picker; either can be used to select the image file

**New API client**:
- `frontend/assets/js/client/UploadClient.js`
- `initUpload(gameSlug, filename)` — `POST /games/:game_slug/photo_upload.json` with `Authorization: Token ...`, returns `{ id, token }`
- `submitUpload(id, token, file)` — `PATCH /uploads/:id/submit` as multipart with field `file`; sends token as `X-Upload-Token` request header

**Game edit page changes**:
- Add "Upload Photo" button alongside the existing photo URL field (not replacing it)
- Wire `showUploadModal` boolean state, pass `onClose` / `onSuccess` to `PhotoUploadModal`

**Translations**: add keys for modal title, submit button, cancel button, and error message in `en.yaml` and `pt.yaml`

## Benefits
- Users can upload actual image files for games from the edit page rather than entering an external URL
