# Plan: Add create stl_model page

Issue: [1036-add-create-stl-model-page.md](../issues/1036-add-create-stl-model-page.md)

## Overview

Add an admin/staff-only create flow for `StlModel`: a `POST` create endpoint (`name` + free-typed `tags`, get-or-create/lowercased/deduped) and a separate photo-upload endpoint mirroring `treasure`'s single-always-replaced-photo shape, both gated by `require_staff`. On the frontend, a new create page/controller/helper mirrors the `treasure` create trio with an NPC-style deferred photo upload (create first, upload second, retry/skip on failure). Along the way, fix a pre-existing bug where STL models with no photo fall back to the wrong (game) placeholder, by wiring in a renamed, dedicated placeholder image, and add a click-to-upload photo link on the show page (mirroring PC/NPC), with tags moved into the left column there. A small unrelated tweak drops `CharacterLinkWriteSerializer.MAX_LINKS` from 50 to 10.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### 1. Create endpoint — `POST /miniatures/stl_models.json`

Request body:
```json
{ "name": "string (required)", "tags": ["string", "..."] }
```
- `tags` is optional (defaults to none), array of strings, max **20** entries.
- Each tag string: trimmed, lowercased, and length-validated against `Tag.name`'s DB `max_length=200` *before* `get_or_create` runs (returns a `400` per-field error on violation, not a raw DB error).
- Frontend pre-processes the raw comma-separated input (split, trim, drop blanks, drop case-insensitive duplicates) before ever including a string in this array — the backend does not need to re-dedupe within a request, only re-lowercase for the `Tag` lookup/creation itself.

Responses:
- `201` — body is the existing `StlModelDetailSerializer` shape: `{ id, name, photo_url, links: [], sources: [], tags: ["..."] }` (`sources`/`links` always empty on a freshly created model).
- `400` — `{ "errors": { "<field>": ["message", ...] } }` (e.g. `name` missing, a `tags` entry too long, more than 20 `tags` entries).
- `401` — unauthenticated (DRF's normal `IsAuthenticated` rejection, already in effect on this view for `GET`).
- `403` — `{ "errors": { "detail": ["not allowed"] } }` — authenticated but not staff/superuser.

### 2. Photo-upload endpoint — `POST /miniatures/stl_models/:id/photo_upload.json`

Mirrors `treasure_photo_upload`'s two-phase shape (init endpoint + the site-wide generic upload-by-token flow `PhotoUploadSaga`/`UploadInitiator` already implement) — same request/response contract `UploadInitiator.run()` already produces for treasure (an `Upload` id/token payload), no shape changes needed from frontend's perspective beyond pointing `PhotoUploadSaga.upload` at this new path. Permission: `require_staff` (401 unauthenticated / 403 not staff-or-superuser), not treasure's game-ownership check.

### 3. `resourceConfig`'s `stlModel` entry (frontend-internal, but the paths must match the backend routes exactly)

- `POST.collection.regular`/`.private` → `path: () => '/miniatures/stl_models.json'` (both point at the same object, no restricted/full variant).
- `POST.single.regular`/`.private` → `path: ({ id }) => '/miniatures/stl_models/${id}/photo_upload.json'` (same, no restricted/full variant).

### 4. New translation keys frontend introduces (translator adds the actual copy — see [translator.md](translator.md) for the full list and existing-key reuse notes)

- `stl_models_page.new_stl_model`
- `stl_model_new_page.title` / `.name_label` / `.tags_label` / `.tags_input_placeholder` / `.add_tag` / `.submit` / `.error` / `.photo_upload_failed` / `.retry_photo_upload` / `.skip_photo_upload`
- Reused as-is, no new key: `stl_model_page.tags` (existing "Tags" heading, now used in the left column instead of the right), `photo_upload_modal.title` (existing generic upload-button label).
