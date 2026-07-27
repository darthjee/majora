# Frontend Plan: List game document files and photos

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint table, the `gameDocumentPhoto`/`gameDocumentFile` `RequestStore` resource shapes, and the i18n keys this agent must reference (values are added by the `translator` agent — see [translator.md](translator.md) for the exact list, coordinate on key names, do not rename them independently).

## Implementation Steps

### Step 1 — Register the two new `RequestStore` resources

New files, mirroring `frontend/assets/js/utils/requests/config/documentConfig.js`'s `GET.single` shape (not `collection`, since these aren't character-scoped — params are just `{ gameSlug, id }`, `id` being the `GameDocument`'s own id):

- `frontend/assets/js/utils/requests/config/gameDocumentPhotoConfig.js`:
  ```js
  export default {
    GET: {
      collection: {
        regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photos.json`, permission: null },
        private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photos/all.json`, permission: 'can_edit' },
      },
    },
  };
  ```
- `frontend/assets/js/utils/requests/config/gameDocumentFileConfig.js` — same shape, `files.json`/`files/all.json`.

Register both in `frontend/assets/js/utils/requests/resourceConfig.js`'s `RESOURCES` map under keys `gameDocumentPhoto` and `gameDocumentFile` (camelCase, matching the existing `staffUser`-style convention — not the snake_case names used in the issue's prose).

### Step 2 — Photo shortlist on the document page

Model this closely on the existing `frontend/assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx` + `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx` (a bespoke `PhotoCard` grid + `SeeAllCard`, not the generic `ShortList`/`shortListResourceConfig` mechanism — that mechanism only supports `action: 'navigate'`/`'none'` href-based clicks, not "open a modal"):

- New `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPhotosPreview.jsx` + `.../helpers/DocumentPhotosPreviewHelper.jsx`.
- Fetch via `RequestStore.ensure({ componentName: 'DocumentPhotosPreview', resource: 'gameDocumentPhoto', quantityType: 'collection', params: { gameSlug, id: documentId }, query: { per_page: MAX_PREVIEW_PHOTOS } })` — reuse the existing `MAX_PREVIEW_PHOTOS = 11` constant from `frontend/assets/js/components/common/cards/characterPreviewConstants.js` (already exactly `11`, matching the issue's spec — do not redefine it).
- Render each photo with the existing `PhotoCard` (`frontend/assets/js/components/common/cards/PhotoCard.jsx`), `onClick` opening the photo modal (no profile-photo affordance needed: pass `canSetProfilePhoto={false}`, `isProfilePhoto={false}`, no-op `onSetProfilePhoto`).
- "See more" card: `SeeAllCard` with `icon={Icons.camera}` (already `bi-camera-fill`, matches the issue's spec exactly — no `Icons.js` change needed) and `href="#/games/${gameSlug}/documents/${documentId}/photos"`.
- Empty state text key: `game_document_photos_preview.empty`. Section title key: `document_page.photos_title`.
- Lift `selectedPhoto` state up into `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` (mirroring `CharacterPhotos.jsx`'s `selectedPhoto`/`PhotoViewModal` wiring) and render `PhotoViewModal` (`frontend/assets/js/components/common/modals/PhotoViewModal.jsx`) there with `canSetProfilePhoto={false}`.

### Step 3 — File shortlist on the document page

New `frontend/assets/js/components/resources/document/pages/elements/show/DocumentFilesPreview.jsx` + `.../helpers/DocumentFilesPreviewHelper.jsx`, structurally parallel to Step 2's photo preview:

- Fetch `gameDocumentFile` the same way, `query: { per_page: 11 }` (add a sibling constant next to `MAX_PREVIEW_PHOTOS` in `characterPreviewConstants.js`, e.g. `MAX_PREVIEW_FILES`, rather than hardcoding the literal).
- New card component `frontend/assets/js/components/common/cards/DocumentFileCard.jsx`: image is `file.photo_path` when present, else the existing placeholder `frontend/assets/images/placeholders/default_file.png` (already exists, no new asset). Wrap the card in `CardHoverTooltip` (`frontend/assets/js/components/common/cards/CardHoverTooltip.jsx`) showing `file.name`. Clicking the card downloads `file.path` without navigating the SPA away — a plain `<a href={file.path} download>` wrapping the card image achieves this natively (no `window.location` hash change involved); do not use a click handler that pushes a hash route.
- "See more" card: icon needs a new `Icons.files = 'bi-files'` entry in `frontend/assets/js/utils/ui/Icons.js` (no existing entry matches — `Icons.camera`/`Icons.folder` are the closest, neither is `bi-files`), href `#/games/${gameSlug}/documents/${documentId}/files`.
- Empty state text key: `game_document_files_preview.empty`. Section title key: `document_page.files_title`.

### Step 4 — Mount both shortlists on the document show page

`frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`'s `bottom` array is currently empty — add `{ Show: DocumentPhotosPreview }` and `{ Show: DocumentFilesPreview }` there (mode-gated: these previews need a real document id, so they make no sense on `new`/`edit`). The document id and `game_slug` are already present in the `context` object `ShowPageLayout` spreads into every slot (the fetched `GameDocument`), so no extra plumbing is needed beyond passing the `onSelectPhoto` handler through `context.handlers` alongside the existing `onOpenUploadModal`.

### Step 5 — New full list pages

Two new pages, everyone-accessible, paginated:

- **Photos** (`/#/games/:game_slug/documents/:id/photos`): bespoke page mirroring `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` + `.../helpers/BaseCharacterPhotosHelper.jsx` (photo grid via `PhotoCard`, `Pagination`, `PhotoViewModal` on click) — but simpler: no upload button, no profile-photo affordance (there is no "profile photo" concept for a `GameDocument`). Build the fetch directly on `RequestStore.ensure()` (mirroring `ShortListController.js`/`fetchRequestStoreList.js`'s modern pattern), not on the legacy `GenericClient`-based `BaseCharacterPhotosController` — the rest of the document feature (`GameDocumentController.js`) is already on `RequestStore`. New files: `frontend/assets/js/components/resources/document/pages/GameDocumentPhotos.jsx`, `.../controllers/GameDocumentPhotosController.js`, `.../helpers/GameDocumentPhotosHelper.jsx`.
- **Files** (`/#/games/:game_slug/documents/:id/files`): same structure as the photos page but rendering a grid of the Step 3 `DocumentFileCard`. New files: `frontend/assets/js/components/resources/document/pages/GameDocumentFiles.jsx`, `.../controllers/GameDocumentFilesController.js`, `.../helpers/GameDocumentFilesHelper.jsx`.

Both fetch through the `gameDocumentPhoto`/`gameDocumentFile` `RequestStore` resources with `page`/`per_page` read from the hash (mirror `buildListQuery`/`ListPageController`'s pagination-param handling), `params: { gameSlug, id: documentId }`.

### Step 6 — Route registration

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: add `['/games/:game_slug/documents/:id/photos', 'gameDocumentPhotos']` and `['/games/:game_slug/documents/:id/files', 'gameDocumentFiles']` to the route table, positioned before the generic `['/games/:game_slug/documents/:id', 'gameDocument']` entry (and alongside the existing `/edit`/`/new` document routes) — route order matters, more specific literal segments must be matched before the generic `:id` fallback.
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import the two new page components and add `gameDocumentPhotos: <GameDocumentPhotos />` / `gameDocumentFiles: <GameDocumentFiles />` to the page map.

## Files to Change
- `frontend/assets/js/utils/requests/config/gameDocumentPhotoConfig.js`, `gameDocumentFileConfig.js` — new.
- `frontend/assets/js/utils/requests/resourceConfig.js` — register both.
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPhotosPreview.jsx` + helper — new.
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentFilesPreview.jsx` + helper — new.
- `frontend/assets/js/components/common/cards/DocumentFileCard.jsx` — new.
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — add a files-preview max-items constant.
- `frontend/assets/js/utils/ui/Icons.js` — add `files: 'bi-files'`.
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — lift `selectedPhoto`/`PhotoViewModal` state, mount both preview slots' handlers.
- `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js` — add both previews to `bottom`.
- `frontend/assets/js/components/resources/document/pages/GameDocumentPhotos.jsx` + controller + helper — new.
- `frontend/assets/js/components/resources/document/pages/GameDocumentFiles.jsx` + controller + helper — new.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — two new routes.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — two new page-map entries.
- `frontend/specs/...` — Jasmine specs mirroring the above (existing spec tree mirrors `assets/js/`; add specs for every new file, plus updated specs for `GameDocument.jsx`/`documentShowType.js`/`resourceConfig.js`/`HashRouteResolver.js`/`AppHelper.jsx`).

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn test` (or `yarn coverage`) (CI job: `jasmine`).
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`).

## Notes
- Coordinate the exact i18n key names with the `translator` agent before/while implementing — see [plan.md](plan.md)'s shared contracts table; do not invent different key names independently.
- The download behavior ("click downloads the file, does not navigate away") has no existing precedent in this codebase — the plain `<a download>` approach in Step 3 is a recommendation, not a mandated pattern; verify it behaves correctly against the actual `path` values the backend serves (e.g. whether `path` is already a fully-qualified downloadable URL).
