# Plan: Add file photo upload

Issue: [878-add-file-photo-upload.md](../../issues/878-add-file-photo-upload.md)

## Overview

Add the missing upload flow for `GameDocumentFilePhoto` (the model and the `GameDocumentFile.photo` FK already exist from #874, but nothing lets a user actually upload one). A new backend endpoint mirrors the existing `GameItem`/character-item photo-upload pattern (reuse-or-create, deterministic path). The frontend's existing file-upload modal gains an optional photo field that, on submit, chains a second upload (init + submit) after the file's own upload succeeds — the first such chained-upload flow in the frontend. A new `documents.php` proxy cache-cleanup config is added, since none exists for the documents family today.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [proxy](proxy.md)

## Shared contracts

### New endpoint: file photo upload

```
POST /games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json
```
- URL name: `game-document-file-photo-upload`, added to `backend/games/urls/games.py` right after the existing `game-document-file-upload` entry.
- Auth: `CookieTokenAuthentication` + `IsAuthenticated` (standard for this project's upload-init endpoints).
- Permission: new `GameDocumentFilePhotoUploadPermission` in `backend/games/permissions.py` — same shape as `GameDocumentFileUploadPermission`/`GameDocumentPhotoUploadPermission` (`user.is_staff or game.has_player(user) or game.can_be_edited_by(user)`), which covers the issue's stated roles (dm, admin, player, staff).
- Request body (init call): `{ filename }` — validated by the default `PhotoUploadSerializer` (image extensions only: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`). No `name` field (that only applies to the file-creation step).
- Response `201`: `{ upload_id, token, upload_type: "image", file_id: <file.id> }` — same envelope shape `UploadInitiator._create_upload_response` already produces for every other photo-upload endpoint, with `file_id` as the endpoint-specific `id_field`.
- Storage/behavior: deterministic path per file (always replaced on re-upload, no UUID), mirroring `game_item_photo_upload.py`'s `_reuse_or_create_photo` — reuse the file's existing `GameDocumentFilePhoto` (via `file.photo_id`) if present, updating its `path`/`ready`, or create a new one and assign it to `file.photo`. Suggested path segments: `games/<game_slug>/documents/<document_id>/files/<file_id>/photo<ext>`.
- Finishing the upload reuses the existing generic `POST /uploads/:upload_type/:id/submit.json` endpoint — no backend change needed there.

### Frontend chained-upload sequencing

The file-upload modal's submit flow becomes two sequential upload cycles when a photo is selected:
1. Init `POST .../documents/:document_id/file_upload.json` (existing endpoint) → submit. **Required backend change**: today this init response is `{ upload_id, token, upload_type, document_id }` (`game_document_file_upload.py` passes `id_field='document_id', id_value=document.id` to `UploadInitiator`) — it does **not** expose the newly created `GameDocumentFile`'s own id anywhere, but the frontend needs that id to build the photo-upload URL in step 2. `UploadInitiator._create_upload_response` only has access to the object `create_photo` returned (here, the created file itself) at response-build time, after `id_value` was already fixed at construction — so `id_value` alone can't carry it. Backend must extend `UploadInitiator` (or this view specifically) so the response also includes the created file's id, e.g. by having `_create_upload_response` include the created object's own `pk` (it is generically available as the `photo` parameter already passed into that method) under a new key such as `id`, in addition to the existing `id_field`/`id_value` pair — additive change, safe for every other upload-init endpoint reusing `UploadInitiator`. Land this change and confirm the exact response shape here before wiring the frontend.
2. If a photo file was selected: init `POST .../documents/:document_id/files/:file_id/photo_upload.json` (new endpoint above, path built with the file id from step 1) → submit.
3. Only after both cycles complete (or step 2 is skipped) does the modal call `onSuccess()`/reload page data.

### i18n keys (frontend references, translator adds)

Frontend will reference new keys under the existing `file_upload_modal` block (see `frontend/assets/i18n/en.yaml`/`pt.yaml` lines ~60-72) for the optional photo field — suggested names: `file_upload_modal.photo_label` (field label) and reuse `file_upload_modal.error` unless a distinct photo-step error message is warranted (`file_upload_modal.photo_error`). Frontend and translator should agree on final key names before implementation; translator must add matching keys to both `en.yaml` and `pt.yaml` (`npm run check_i18n` enforces parity).
