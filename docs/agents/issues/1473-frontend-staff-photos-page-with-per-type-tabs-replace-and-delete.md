# Issue: Frontend: staff photos page with per-type tabs, Replace and Delete

## Description

Part of #1468 (staff page to manage photos). Majora has 13 photo types (`game`, `game_faction`, `game_item`, `game_common_item`, `game_document`, `game_document_file`, `game_possession`, `character`, `character_item`, `treasure`, `stl_model`, `source`, `collection`). Staff need one place to review and maintain them.

The backend (#1470) and proxy (#1472) sub-issues are merged. All endpoints are staff-or-superuser only:

- `GET /staff/photos.json` returns `{"max_dimension": <int>, "types": [<slug>, ...]}`. The `types` list is ordered and the tabs are built from it.
- `GET /staff/photos/<photo_type>.json` returns a **plain array**, newest first, with pagination in the headers. Each item is `{id, path, ready, replace_in_progress, owner: {type, id, name, kind, game: {slug, name} | null} | null}`. `kind` is `pc`/`npc` for characters. `owner` can be `null`, for example an orphan `GameDocumentFilePhoto`.
- `POST /staff/photos/<photo_type>/<photo_id>/replace.json` takes `{filename}` (same body as a regular photo upload init) and returns **201** `{upload_id, token, upload_type, id, photo_type}`. It returns 409 if a replace is already in flight and 422 `photo_path_missing` when `path` is empty. The proxy upload follows, and the **proxy** runs the `PATCH /uploads/image/<id>.json` finalize, not the frontend.
- `DELETE /staff/photos/<photo_type>/<photo_id>.json` is handled by the proxy. It deletes the file and the record and returns 204, or 422 while a replace is in flight.

Resize and bulk actions are handled by #1474, which builds on this page.

## Problem

Staff cannot browse photos across the 13 photo types, see which ones are broken (not ready or missing file), or fix them without touching the database or the photos volume.

## Expected Behavior

### Page, route and access

- New staff page at `#/staff/photos`, route name `staffPhotos`, with `[{ kind: 'staffOrSuperuser' }]` in `accessRouteConfig`. The controller also calls `AccessStore.ensureStaffOrSuperUser()` like the other staff pages.
- Linked from the **header Admin dropdown** (`HeaderNavHelper.jsx`, `adminItem(...)`), next to the other staff pages. The staff dashboard has no page links, so it is left unchanged.

### Tabs

- **One tab per photo type**, built from `GET /staff/photos.json` `types` in that order.
- Tabs are links driven by the hash query (`#/staff/photos?type=<slug>`) and wrap with `flex-wrap`, so pagination links keep the selected tab. Use the hand-written `nav nav-tabs` markup; there is no shared Tabs component.
- With no `type` param, or an unknown one, the first type is shown.
- Tab labels are **translated**, one i18n key per slug. An unknown slug falls back to the raw slug.

### List (per tab)

- Paginated list of every photo of that type, newest first, using the shared `Pagination` component. Each row shows:
  - a **thumbnail** (`path` used as the `src`). If the image fails to load, an `onError` handler swaps in a **broken-image placeholder**. This is new; nothing uses `onError` today;
  - a **ready / not-ready** indicator, plus a "replace in progress" indicator when `replace_in_progress` is true;
  - the **owner**:
    - The owner name links to the entity page when it can be built from the payload:

      | Owner type | Link |
      |---|---|
      | `game` | `/games/:slug` |
      | `game_faction` | `/factions/:id` |
      | `game_item` | `/items/:id` |
      | `game_common_item` | `/common_items/:id` |
      | `game_document` | `/documents/:id` |
      | `game_possession` | `/possessions/:id` |
      | `character` | `/pcs/:id` or `/npcs/:id`, chosen by `kind` |
      | `treasure` | `/games/:slug/treasures/:id`, or `/treasures/:id` when there is no game |
      | `stl_model`, `source`, `collection` | their `/miniatures/...` pages |

    - `character_item` and `game_document_file` owners are shown as **plain text**: the payload lacks what the routes need.
    - A `null` owner shows an "orphan / no owner" label.
    - The game name is shown when `owner.game` is present.

### Replace

- Opens the existing `PhotoUploadModal` to pick a file. The old image stays visible until the upload finishes.
- Uses `UploadClient.runUploadCycle('/staff/photos/<type>/<id>/replace.json', file, token)`. This does not go through `RequestStore.mutate`.
- Allowed for not-ready photos too, since replacing fixes them.
- **Disabled** while `replace_in_progress` is true or when `path` is empty.
- After a successful replace:
  - the list is **refetched**, which picks up `ready` and a path whose extension may have changed;
  - that row's thumbnail gets a **version param** (`?v=<timestamp>`), so a same-path overwrite doesn't show the cached old image.

### Delete

- Shows a confirmation dialog, reusing `DeletePhotoConfirmModal` (moved from `character/pages/elements/` to `common/modals/`, keeping its `delete_photo_confirm_modal.*` keys).
- Sends a single `DELETE` through `RequestStore.mutate` with the staff variant; the list cache is purged on success.
- Enabled for **ready and not-ready** photos; **disabled** only while `replace_in_progress` is true.

### Error handling

- **409** (replace already in flight) and **422** (delete blocked by an in-flight replace, or replace refused because `path` is missing) show a specific message.
- **404** (photo or owner gone) shows a message and **refetches the list**.
- Any other failure shows a generic error.

### Translations

- Every new string has a translation in all languages under `frontend/assets/i18n/` (`en`, `pt`): the page, the 13 tab labels, the header nav entry, indicators and error messages. Add a new `staff_photos_page.yaml`, registered in each `index.js`.
- `yarn check_i18n` passes.

## Solution

- **Requests:** new `frontend/assets/js/utils/requests/config/staffPhotoConfig.js` modelled on `staffUserConfig.js`, where `regular` and `private` point at the same object. It is registered in `resourceConfig.js` with:
  - an index entry;
  - a list entry with `:photoType` and pagination params;
  - a DELETE entry.
- **Reads:** `RequestStore.ensure(...)`, which returns `{data, pagination}`.
- **Routing:** add the route in `HashRouteResolver.js`, map it in `AppHelper.jsx`, and add it to `accessRouteConfig.js`.
- **Upload status:** `UploadClient.runUploadCycle` currently returns `{ok: false}` with no status. Extend it to return the HTTP `status`, so the page can tell 409, 422 and 404 apart. Existing callers (`PhotoUploadSaga`, `PhotoUploadModalController`) keep working because they only read `ok`. `PhotoUploadModal` needs to show a status-specific error, or let the page handle it through a callback.
- **Delete:** `PhotoDeleteSaga` is character-specific (PATCH not-ready, then DELETE), so it is **not** reused.
- **`max_dimension`:** read by the page but not used in this scope; #1474 consumes it.
- **Tests:** Jasmine specs for the new controller and helpers, routing and access config, the `UploadClient` status change, the owner-link builder (every type, including the plain-text and null cases), and the error branches.

## Benefits

- Staff can review every photo type in one place, spot broken photos, and fix them (Replace) or remove them (Delete) without database or filesystem access.
- This lays the foundation for the client-side resize and bulk actions in #1474.
