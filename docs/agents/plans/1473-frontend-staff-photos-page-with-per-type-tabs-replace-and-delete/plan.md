# Plan: Frontend: staff photos page with per-type tabs, Replace and Delete

Issue: [1473-frontend-staff-photos-page-with-per-type-tabs-replace-and-delete.md](../../issues/1473-frontend-staff-photos-page-with-per-type-tabs-replace-and-delete.md)

## Overview

Add a staff-only page at `#/staff/photos` (route `staffPhotos`) that lists every photo of each of the 13 photo types in tabs built from `GET /staff/photos.json`, with paginated rows (thumbnail with broken-image fallback, ready / replace-in-progress indicators, owner link) and per-row Replace (through `PhotoUploadModal` + `UploadClient.runUploadCycle` against the staff replace URL) and Delete (through `RequestStore.mutate` DELETE, reusing `DeletePhotoConfirmModal` moved to `common/modals/`). The backend (#1470) and proxy (#1472) are already merged; this is frontend + translations only.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Corrections to the issue text (verified against the code)

- **Owner routes**: game-scoped owner pages live under `/games/:game_slug/...` (e.g. `/games/:slug/factions/:id`), not top-level `/factions/:id`. Only `treasure` (no game) and the miniatures routes are top level. The owner-link builder uses `owner.game.slug`; see the table in the shared contracts.
- **"Staff variant"**: `RequestStore.mutate` only knows `regular` / `private`. `staffPhotoConfig.js` points both at the same object and the DELETE is sent with `variantName: 'regular'`.
- **i18n registration**: page namespaces are loaded lazily by file name through the `chunkLoaders` Proxy in `frontend/assets/i18n/<lang>/index.js`; `staff_photos_page.yaml` needs **no** `index.js` change. The header key goes into `common.yaml` under the existing `header` namespace (already in `commonNamespaces`).

## Shared contracts

### i18n keys (translator produces, frontend consumes)

New file `frontend/assets/i18n/{en,pt}/staff_photos_page.yaml`, single top-level key `staff_photos_page`:

| Key | en value |
|---|---|
| `staff_photos_page.title` | Photos |
| `staff_photos_page.loading` | Loading photos... |
| `staff_photos_page.error` | Failed to load photos. Please try again. |
| `staff_photos_page.empty` | There are no photos of this type. |
| `staff_photos_page.types.<slug>` for each of `game`, `game_faction`, `game_item`, `game_common_item`, `game_document`, `game_document_file`, `game_possession`, `character`, `character_item`, `treasure`, `stl_model`, `source`, `collection` | Games, Factions, Items, Common Items, Documents, Document Files, Possessions, Characters, Character Items, Treasures, STL Models, Sources, Collections |
| `staff_photos_page.thumbnail_column` | Photo |
| `staff_photos_page.status_column` | Status |
| `staff_photos_page.owner_column` | Owner |
| `staff_photos_page.actions_column` | Actions |
| `staff_photos_page.thumbnail_alt` | Photo thumbnail |
| `staff_photos_page.broken_image_alt` | Image unavailable |
| `staff_photos_page.status_ready` | Ready |
| `staff_photos_page.status_not_ready` | Not ready |
| `staff_photos_page.status_replace_in_progress` | Replace in progress |
| `staff_photos_page.owner_orphan` | Orphan (no owner) |
| `staff_photos_page.replace` | Replace |
| `staff_photos_page.delete` | Delete |
| `staff_photos_page.error_replace_in_progress` | A replace is already in progress for this photo. (409 on replace) |
| `staff_photos_page.error_path_missing` | This photo has no file path, so it cannot be replaced. (422 on replace) |
| `staff_photos_page.error_delete_replace_in_progress` | This photo cannot be deleted while a replace is in progress. (422 on delete) |
| `staff_photos_page.error_not_found` | The photo or its owner no longer exists — the list has been refreshed. (404) |
| `staff_photos_page.error_generic` | That action could not be completed. Please try again. |

Plus `header.nav_staff_photos` in `common.yaml` (en: `Photos`, pt: `Fotos`).

Existing keys reused unchanged: `delete_photo_confirm_modal.*`, `photo_upload_modal.*` (both in `common.yaml`).

### API (already implemented by backend/proxy, consumed by frontend)

- `GET /staff/photos.json` → `{max_dimension: int, types: [slug, ...]}`
- `GET /staff/photos/<photo_type>.json?page=&per_page=` → plain array, pagination in `page`/`pages`/`per_page`/`total` headers; item `{id, path, ready, replace_in_progress, owner: {type, id, name, kind, game: {slug, name} | null} | null}`
- `POST /staff/photos/<photo_type>/<id>/replace.json` `{filename}` → 201 `{upload_id, token, upload_type, id, photo_type}`; 409 replace in flight; 422 `photo_path_missing`; 404 gone
- `DELETE /staff/photos/<photo_type>/<id>.json` → 204; 422 while a replace is in flight; 404 gone

### Owner link table (frontend-internal, recorded here for review)

| Owner type | Link |
|---|---|
| `game` | `#/games/${owner.game.slug}` |
| `game_faction` | `#/games/${slug}/factions/${id}` |
| `game_item` | `#/games/${slug}/items/${id}` |
| `game_common_item` | `#/games/${slug}/common_items/${id}` |
| `game_document` | `#/games/${slug}/documents/${id}` |
| `game_possession` | `#/games/${slug}/possessions/${id}` |
| `character` | `#/games/${slug}/pcs/${id}` or `#/games/${slug}/npcs/${id}` by `kind` |
| `treasure` | `#/games/${slug}/treasures/${id}`, or `#/treasures/${id}` when `owner.game` is null |
| `stl_model` / `source` / `collection` | `#/miniatures/stl_models/${id}` / `#/miniatures/sources/${id}` / `#/miniatures/collections/${id}` |
| `character_item`, `game_document_file` | plain text |
| any game-scoped type with `owner.game == null` | plain text |
| `owner == null` | `staff_photos_page.owner_orphan` label |
