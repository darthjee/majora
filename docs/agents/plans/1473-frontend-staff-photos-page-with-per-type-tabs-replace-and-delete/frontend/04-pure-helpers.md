# Pure helpers (owner link, type resolution, error mapping)

Pure, fully-specced helpers under `components/resources/staff_photo/pages/helpers/` (or `utils/`):

- **Owner-link builder** — given `owner`, returns `{ href, text }` (href `null` for plain text) following the owner-link table in [plan.md](../plan.md#shared-contracts). Implement as a map from owner type to builder function. Rules: `character` picks `pcs`/`npcs` by `kind`; `treasure` uses `/treasures/:id` when `owner.game` is null; `character_item` and `game_document_file` are plain text; any game-scoped type with a null `game` falls back to plain text; unknown type → plain text. A `null` owner is handled by the caller (orphan label).
- **Type resolution** — `resolveType(types, requested)`: `requested` if it is in `types`, otherwise `types[0]`.
- **Tab label** — `staff_photos_page.types.<slug>` translation, falling back to the raw slug when the key is missing (check how `Translator.t` reports a missing key and compare accordingly).
- **Error mapping** — `(action, status) → i18n key`: replace 409 → `error_replace_in_progress`; replace 422 → `error_path_missing`; delete 422 → `error_delete_replace_in_progress`; 404 (either) → `error_not_found`; anything else → `error_generic`.
- **Thumbnail src** — `path` plus `?v=<ts>` when a version is recorded for the photo id (use `&` if `path` already has a query).

Specs must cover every owner type, the plain-text, null-game and unknown cases, every error branch, and type resolution with missing/unknown params.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoOwnerLink.js` — new
- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoTypes.js` — new (type resolution + tab label)
- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoErrors.js` — new (status → key)
- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoThumbnailSrc.js` — new (or fold into another helper)
- matching specs under `frontend/specs/assets/js/components/resources/staff_photo/pages/helpers/`
