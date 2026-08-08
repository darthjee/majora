# Frontend Plan: Add create stl_model page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes both endpoints from [plan.md](plan.md)'s "Shared contracts" #1 and #2 exactly as specified — request/response shapes, status codes. Produces the `resourceConfig` paths in #3 (must match the backend routes verbatim) and the new translation keys enumerated in #4 (actual copy is [translator](translator.md)'s job; this plan only introduces the `Translator.t('...')` call sites).

## Implementation Steps

### Step 1 — Placeholder rename & wiring (fixes the pre-existing game-placeholder bug)

1. `git mv frontend/assets/images/placeholders/default_stl_miniature.png frontend/assets/images/placeholders/default_stl_model.png`.
2. New `frontend/assets/js/components/common/cards/CardStlModelImage.jsx`, same shape as `CardTreasureImage.jsx`, importing the renamed placeholder.
3. In `frontend/assets/js/components/common/misc/ActionsOverlay.jsx`, add `stl_model: CardStlModelImage` to the `PHOTO_COMPONENTS` map (plus the import and the JSDoc `@param` type-union comment listing it).
4. In `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx`, swap the direct `<CardPhoto url={stlModel.photo_url} .../>` for the new `ActionsOverlay`-based render from Step 5 below (this step's own scope is just making `CardStlModelImage` exist and registered — the actual detail-page swap happens together with Step 5's `canEdit`/upload wiring, to avoid touching `StlModelHelper.render`'s signature twice).

### Step 2 — Reusable tags-badges-and-input field

New `frontend/assets/js/components/common/forms/TagsField.jsx` (generic — not STL-model-specific, since the shape is a plain string-list editor):
- Props: `tags` (current pending list), `inputValue`, `onInputChange`, `onAdd` (handles both the button click and Enter keydown), `onRemove` (optional, per-badge remove — not required by the issue but cheap to include for form usability; confirm with the issue text before adding remove-ability if that wasn't discussed — if in doubt, omit `onRemove` and keep the list append-only to match exactly what was decided), `errors`.
- Renders the pending tags as `Badge`s on the left, then a text input + "Add" button.
- The split/trim/blank-drop/dedupe logic (per the issue's edge-case decisions) lives in the *page* component's `onAdd` handler (so it's easy to unit-test via the controller/page, not baked into the presentational field) — `TagsField` itself just renders whatever list it's given.

### Step 3 — Photo field for the create form

New `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelPhotoField.jsx`, same shape as `CharacterAvatarField.jsx`: renders a local preview `url` (or the `default_stl_model.png` placeholder via `CardStlModelImage` when none is picked yet) with an upload-button overlay that opens `PhotoUploadModal` in `deferred` mode.

### Step 4 — `resourceConfig`

Extend `frontend/assets/js/utils/requests/config/stlModelConfig.js` (currently `GET`-only):
```js
const create = { path: () => '/miniatures/stl_models.json', permission: null };
const photoUploadInit = { path: ({ id }) => `/miniatures/stl_models/${id}/photo_upload.json`, permission: null };

// added to the exported object:
POST: {
  collection: { regular: create, private: create },
  single: { regular: photoUploadInit, private: photoUploadInit },
},
```
Update the file's own top-of-file doc comment (it currently states "GET-only" and "no write endpoint exists for `stl_models` at all" — both now false).

### Step 5 — Create page/controller/helper

New files under `frontend/assets/js/components/resources/stl_model/pages/`:
- `StlModelNew.jsx` — state: `name`, `tags` (pending list), `tagInput`, `photoFile`, `status`, `fieldErrors`, `createdId` (for retry-after-failure). Wires `StlModelNewController`.
- `controllers/StlModelNewController.js` — mirrors `TreasureNewController` + `GameNpcNewController`'s deferred-upload combo:
  - `buildEffect()`: `AccessStore.ensureStaffOrSuperUser()` → redirect to `/` (via `window.location.hash`) if not staff/superuser.
  - `submitForm(event, formValues, setters)`: re-check staff/superuser (redirect if not), then `RequestStore.mutate` a `POST` to the `stlModel` collection endpoint with `{ name, tags }`.
    - `201`: if `formValues.photoFile` is set, run `#uploadPhoto` (resolve the `stlModel` `POST.single` path for the new id via `RequestStore.resolvePath`, `PhotoUploadSaga.upload(...)`); on success purge the `stlModel` cache and redirect to `#/stl_models/:id`; on failure set `status: 'photo-upload-failed'` and keep the id. If no photo was picked, redirect immediately.
    - `400`: set `fieldErrors`.
    - other: set `status: 'error'`.
  - `retryPhotoUpload(id, photoFile, setters)` / a "skip" action that just redirects to the detail page without retrying — mirror `GameNpcNewController#retryPhotoUpload` and the sibling skip button seen in `NpcNewPhotoUploadFailedAlert.jsx` (`onSkipPhotoUpload`).
- `helpers/StlModelNewHelper.jsx` — renders: `FormField` for `name`, `TagsField` (Step 2) for tags, `StlModelPhotoField` (Step 3) for the photo, a submit button, and — when `status === 'photo-upload-failed'` — a warning alert with retry/skip buttons (mirroring `NpcNewPhotoUploadFailedAlert.jsx`'s markup, inlined here since STL model has no `ShowPageLayout`-style slot system to plug into).

### Step 6 — Routing

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: add `['/stl_models/new', 'stlModelNew']`, ordered before whatever line matches `/stl_models/:id`.
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import `StlModelNew` and add `stlModelNew: <StlModelNew />` to the route-to-element map.

### Step 7 — List page: conditional "New STL model" button

- `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx`: add `isStaffOrSuperUser` state resolved via `AccessStore.ensureStaffOrSuperUser()` in a mount effect, pass it down to the helper.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx`: render the `NewButton` (linking `#/stl_models/new`, using the new `stl_models_page.new_stl_model` key) only when `isStaffOrSuperUser` is true; update the class doc comment (it currently says "no 'New' action since no create endpoint exists").

### Step 8 — Show page: photo click-to-upload + tags moved left

- `frontend/assets/js/components/resources/stl_model/pages/StlModel.jsx`: add `isStaffOrSuperUser` (via `AccessStore.ensureStaffOrSuperUser()`) and `showUploadModal` state; handlers to open/close the modal and to refetch+purge (`RequestStore.purge({ resource: 'stlModel' })`) on upload success, mirroring `Treasures.jsx`'s `handleUploadSuccess`.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx`:
  - Left column: replace the direct `<CardPhoto .../>` with `<ActionsOverlay type="stl_model" url={stlModel.photo_url} alt={stlModel.name} canEdit={isStaffOrSuperUser} onClick={handlers.onOpenUploadModal} />`, and move the tags-badges block (`#renderTags`) here, right under the photo.
  - Right column: drop the tags block from its current spot (keep links/sources as-is).
  - Render a `PhotoUploadModal` alongside, `uploadPath` from the `stlModel` `POST.single` config entry with `{ id: stlModel.id }`.

### Step 9 — Jasmine specs

Mirror the existing spec tree under `frontend/specs/assets/js/components/...` for every new/changed file above (one spec per component/controller/helper, following this codebase's existing per-file spec convention — e.g. `TreasureNewControllerSpec.js`, `GameNpcNewControllerSpec.js` as the closest structural templates for the new controller's deferred-upload branches).

## Files to Change
- `frontend/assets/images/placeholders/default_stl_miniature.png` → renamed to `default_stl_model.png`.
- `frontend/assets/js/components/common/cards/CardStlModelImage.jsx` — new.
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — register `'stl_model'`.
- `frontend/assets/js/components/common/forms/TagsField.jsx` — new, generic tags editor.
- `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelPhotoField.jsx` — new.
- `frontend/assets/js/utils/requests/config/stlModelConfig.js` — add `POST` entries.
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — new.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js` — new.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` — new.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — new route.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register new page.
- `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx` — access-check state.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx` — conditional "New" button.
- `frontend/assets/js/components/resources/stl_model/pages/StlModel.jsx` — upload-modal + access state.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx` — `ActionsOverlay`, tags moved left.
- `frontend/specs/assets/js/components/...` — new/updated specs mirroring every file above.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until [translator](translator.md)'s keys land in every locale file; land both in the same PR.

## Notes
- Whether `TagsField` gets per-badge removal wasn't explicitly decided in the issue dialogue (only "add" was discussed) — default to append-only unless a reviewer/PO asks for removal.
- Confirm `RequestStore.resolvePath`'s exact signature (used by `GameNpcNewController#uploadPhoto`) works for a resource with no `gameSlug` param, since `stlModel` has none — the params object should just be `{ id: createdId }`.
