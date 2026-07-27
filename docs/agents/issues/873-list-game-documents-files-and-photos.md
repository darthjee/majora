# Issue: List game document files and photos

## Description
The game document detail page (`/#/games/:game_slug/documents/:id`) fetches document data through `RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`), using the `document` resource configured at `frontend/assets/js/utils/requests/config/documentConfig.js`.

Two endpoints already exist for a single document:
- `GET /games/:game_slug/documents/:id.json` — everyone can access, does not show hidden documents.
- `GET /games/:game_slug/documents/:id/full.json` — dm and admin only, also shows hidden documents.

`GameDocument` has related `GameDocumentPhoto` and `GameDocumentFile` records, but the document detail page has no way to list them.

## Problem
`GameDocument` has `GameDocumentPhoto` and `GameDocumentFile` associations, but there is no listing for them anywhere in the frontend or backend — a document's photos and files are currently invisible to users.

## Solution
Add shortlists (preview grids on the document detail page) and full paginated list pages for both `GameDocumentPhoto` and `GameDocumentFile`, following the existing generic shortlist/list-page pattern already used for `pc`, `npc`, `treasure`, `item`, and `document`:
- `frontend/assets/js/components/common/cards/ShortList.jsx` + `shortListResourceConfig.js` for the preview grids.
- `frontend/assets/js/components/common/list_page/ListPage.jsx` + `frontend/assets/js/components/common/list_types/listTypeConfig.js` for the full paginated list pages.

### Photo shortlist
Lists `GameDocumentPhoto` records for the document.
- `per_page` request parameter: `11` (instead of the shortlist default of `5`).
- Click action: opens the photo in the existing `PhotoViewModal` (`frontend/assets/js/components/common/modals/PhotoViewModal.jsx`).
- "See more" button: bootstrap icon `camera-fill`, navigates to `/#/games/:game_slug/documents/:id/photos`.
- `RequestStore` resource: new dedicated resource `game_document_photo` with its own config file.
  - `regular` endpoint: `GET /games/:game_slug/documents/:id/photos.json` (already exists in `backend/games/views/games/game_document_photos.py` — extend it to support `per_page=11` pagination).
  - `private` endpoint: `GET /games/:game_slug/documents/:id/photos/all.json` (new — no "all" counterpart exists yet; add it with the same pagination support).

### File shortlist
Lists `GameDocumentFile` records for the document.
- `per_page` request parameter: `11` (instead of the shortlist default of `5`).
- Click action: downloads the file without navigating away from the page.
- Image: shows the file's own photo (`GameDocumentFile.photo`, a `GameDocumentFilePhoto`) when present, otherwise the default file placeholder `frontend/assets/images/placeholders/default_file.png` (already exists — no new asset needed).
- Mouse-over tooltip: the file's `name` attribute.
- "See more" button: bootstrap icon `files`, navigates to `/#/games/:game_slug/documents/:id/files`.
- `RequestStore` resource: new dedicated resource `game_document_file` with its own config file.
  - `regular` endpoint: `GET /games/:game_slug/documents/:id/files.json` (new).
  - `private` endpoint: `GET /games/:game_slug/documents/:id/files/all.json` (new).

### New frontend pages
- `/#/games/:game_slug/documents/:id/files` — accessible by everyone, lists files for a document, paginated.
- `/#/games/:game_slug/documents/:id/photos` — accessible by everyone, lists photos for a document, paginated.

### New/updated backend endpoints
Following the existing regular/private pattern used elsewhere for `GameDocument` lists (e.g. `backend/games/views/games/game_documents.py` / `game_documents_all.py`, using `paginated_list_response()` from `backend/games/views/common.py`):

- `GET /games/:game_slug/documents/:id/files.json` — accessible by everyone, paginated, does not show files for a hidden or non-existent document (returns as if the document doesn't exist, no 404 leak).
- `GET /games/:game_slug/documents/:id/files/all.json` — dm/admin only, paginated, shows files even when the document is hidden, returns 404 for a non-existent document.
- `GET /games/:game_slug/documents/:id/photos.json` — accessible by everyone, paginated, does not show photos for a hidden or non-existent document. (Endpoint already exists — extend it to support `per_page=11` pagination as described above.)
- `GET /games/:game_slug/documents/:id/photos/all.json` — dm/admin only, paginated, shows photos even when the document is hidden, returns 404 for a non-existent document.

### Serializers
#### File serializer
Shared by `.../files.json` and `.../files/all.json`:
- `name`
- `path`
- `photo_path` (or a better name) — path of the file's `GameDocumentFilePhoto`, nullable.
- other fields as needed for rendering.

#### Photo serializer
Shared by `.../photos.json` and `.../photos/all.json`:
- `id`
- `path`

This matches the existing `GameDocumentPhotoSerializer` (`backend/games/serializers/games/documents/game_document_photo.py`) and the same `id`/`path`-only pattern used by `GameItemPhotoSerializer` and `CharacterPhotoSerializer` elsewhere in the codebase — reuse `GameDocumentPhotoSerializer` directly rather than adding a new one.

### UI details
- When a file has no photo, show `frontend/assets/images/placeholders/default_file.png`.
