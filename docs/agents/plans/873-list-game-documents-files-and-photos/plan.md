# Plan: List game document files and photos

Issue: [873-list-game-documents-files-and-photos.md](../issues/873-list-game-documents-files-and-photos.md)

## Overview
Add a photo shortlist and a file shortlist to the game document detail page (`/#/games/:game_slug/documents/:id`), each backed by a new `RequestStore` resource, plus two new full paginated list pages (`/photos`, `/files`). Photos reuse the existing `GameDocumentPhoto`/`GameDocumentPhotoSerializer` machinery (only `photos/all.json` and the frontend wiring are new); files are entirely new end to end (model already exists, everything else — serializer, views, routes, frontend resource, pages — needs to be built).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Backend endpoints (consumed by frontend)

| Endpoint | URL name | Auth | Notes |
|---|---|---|---|
| `GET /games/:game_slug/documents/:id/photos.json` | `game-document-photos` | `AllowAny`, hides hidden docs | **Already exists, no backend change** — `paginated_list_response`/`Paginator` already reads `page`/`per_page` from the query string (see `backend/games/tests/views/games/game_document_photos_test.py::test_respects_page_param`), so it already supports `per_page=11` with no code change. |
| `GET /games/:game_slug/documents/:id/photos/all.json` | `game-document-photos-all` | `GameEditPermission` (dm/admin), 404 for nonexistent doc, includes hidden docs | New. |
| `GET /games/:game_slug/documents/:id/files.json` | `game-document-files` | `AllowAny`, hides hidden docs | New. |
| `GET /games/:game_slug/documents/:id/files/all.json` | `game-document-files-all` | `GameEditPermission` (dm/admin), 404 for nonexistent doc, includes hidden docs | New. |

All four are paginated via `paginated_list_response`, so `?page=`/`?per_page=` work identically on every one of them — no per-endpoint pagination logic needed.

### Serializer field shapes

- **Photo** (`.../photos.json`, `.../photos/all.json`): reuse the existing `GameDocumentPhotoSerializer` — `{ id, path }`. No new serializer.
- **File** (`.../files.json`, `.../files/all.json`): new `GameDocumentFileSerializer` — `{ id, name, path, photo_path }`, where `photo_path` is `source='photo.path', default=None, read_only=True` (nullable), mirroring `GameDocumentListSerializer.photo_path`.

### Frontend `RequestStore` resources (backend has no visibility into these, listed for the frontend agent)

- `gameDocumentPhoto` — `GET.collection`: `regular` → `photos.json` (`permission: null`), `private` → `photos/all.json` (`permission: 'can_edit'`). Params: `{ gameSlug, id }` (`id` = document id).
- `gameDocumentFile` — `GET.collection`: `regular` → `files.json` (`permission: null`), `private` → `files/all.json` (`permission: 'can_edit'`). Params: `{ gameSlug, id }` (`id` = document id).

### i18n keys (frontend references, translator adds the values)

- `document_page.photos_title`, `document_page.files_title` — shortlist section headings.
- `game_document_photos_preview.empty`, `game_document_files_preview.empty` — shortlist empty states.
- `game_document_photos_page.title`, `game_document_photos_page.loading` — full photo list page.
- `game_document_files_page.title`, `game_document_files_page.loading` — full file list page.
- The generic `character_preview_section.see_all` (`"See all {{title}}"`) is reused as-is for both "See more" cards — **no new key needed there**.

Full details, including which values to write, are in [translator.md](translator.md).
