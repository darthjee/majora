# Plan: Convert new stl_mode page into modal

Issue: [1049-convert-new-stl-mode-page-into-modal.md](../issues/1049-convert-new-stl-mode-page-into-modal.md)

## Overview

Purely a frontend change, entirely inside `frontend/`. It has two parts: (1) rescope the STL model
routes from top-level `/#/stl_models...` to `/#/miniatures/stl_models...`, dropping the `/new`
route outright; (2) replace the standalone `StlModelNew` page with a two-column modal launched
from the `StlModels` list page, reusing `StlModelNewController`'s existing create/photo-upload
branching but redirecting to "close modal + reload the list" instead of "navigate to the show
page". No backend, API, or new translation keys are involved — the create endpoint and all
`stl_model_new_page.*`/`stl_models_page.*` i18n keys already exist and are reused as-is.

## Context

See the issue for full background. Key facts already established there:

- Backend already scopes STL models under a `miniatures` Django app (`backend/miniatures/`),
  alongside `source`, `tag`, `stl_model_link`, `stl_model_photo` — the frontend route prefix
  should match, and should not assume `stl_models` is the only child of `/miniatures` going
  forward.
- No back-compat redirect needed for old `/#/stl_models...` URLs.
- Only one other frontend reference to the old path exists: the header nav link.
- Submit/reload behavior is a straight port of today's controller branching — same states
  (submitting / field-error / general-error / photo-upload-failed), just a different terminal
  action (close modal + reload list, instead of redirect to show page).

## Implementation Steps

### Step 1 — Rescope routes

In `frontend/assets/js/utils/routing/HashRouteResolver.js`'s `ROUTES` table:
- Replace `['/stl_models/:id', 'stlModel']` with `['/miniatures/stl_models/:id', 'stlModel']`.
- Replace `['/stl_models', 'stlModels']` with `['/miniatures/stl_models', 'stlModels']`.
- Remove `['/stl_models/new', 'stlModelNew']` entirely (not replaced — see Step 3).

Page keys (`stlModel`, `stlModels`) stay the same; only the path patterns change, so
`AppHelper.jsx`'s page map only loses the `stlModelNew` entry (Step 3), not the other two.

### Step 2 — Update the base paths and links that build these URLs

- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx`:
  `ListPage`'s `basePath="#/stl_models"` → `basePath="#/miniatures/stl_models"` (used for
  pagination links).
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`: the nav link
  `href="#/stl_models"` → `href="#/miniatures/stl_models"`.
- Search the rest of `frontend/assets/js` for any other `#/stl_models` or `/stl_models` literal
  (e.g. `StlModelNewController.js#redirectToStlModel`, `StlModel`'s own "back" link if any) and
  update or remove per Step 3/4 below — do not leave stale references.

### Step 3 — Remove the standalone "new" page and its route wiring

- Delete `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx`.
- Remove the `stlModelNew: <StlModelNew />` entry and its `StlModelNew` import from
  `frontend/assets/js/components/helpers/AppHelper.jsx`.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx`'s form
  markup is reused as the basis for the new modal's body (Step 4) — repurpose rather than
  duplicate; delete it once the modal helper replaces it, or rename/move it if that's cleaner in
  review, but don't leave both the old page-shaped helper and a new modal-shaped helper rendering
  the same fields.

### Step 4 — Build the "new STL model" modal

Create a new modal component (e.g.
`frontend/assets/js/components/resources/stl_model/pages/elements/StlModelNewModal.jsx` +
`.../helpers/StlModelNewModalHelper.jsx`), following the `react-bootstrap` `Modal` shell pattern
already used by `ResourceExchangeModalHelper.jsx` (`Modal` / `Modal.Header` / `Modal.Body` /
`Modal.Footer`), with a two-column `Modal.Body`:

- **Left column**: `StlModelPhotoField` (opens `PhotoUploadModal` in `deferred` mode, same as
  today) + the name `FormField`.
- **Right column**: `TagsField` (add/remove chips) — the only other field today.
- **Footer**: full-width `SubmitButton`, same submitting-disabled behavior as today.

State (`name`, `tags`, `tagInput`, `photoFile`, `photoPreviewUrl`, `status`, `fieldErrors`,
`createdId`) and handlers move from `StlModelNew.jsx` into this component, adapted for a
show/close-controlled modal (`show`, `onClose`, `onSuccess` props) instead of a routed page.

### Step 5 — Adapt `StlModelNewController.js` for modal use

- Remove `buildEffect()` (the staff/superuser page-redirect gate) — the modal is only reachable
  through the button that `StlModelsHelper` already renders exclusively for staff/superuser
  viewers, so a page-mount redirect no longer applies. Keep (or relocate as appropriate) the
  `AccessStore.ensureStaffOrSuperUser()` check inside `submitForm` as a defensive guard, but on
  failure, close the modal (or set an error) instead of navigating `window.location.hash = '/'`.
- Replace `#redirectToStlModel(stlModelId)` (both call sites: after a photo-less success, and
  after a successful photo upload) with an `onSuccess`-style callback supplied by the modal, so
  the modal/page decides what "success" means (close + trigger reload) instead of the controller
  hard-navigating.
- Leave `#performCreate`, `#handleResponse`, `#uploadPhoto`, `#failPhotoUpload`,
  `retryPhotoUpload` branching otherwise unchanged — same four terminal states described in the
  issue's "Submit / reload behavior" section.

### Step 6 — Wire the modal into the list page and reload on success

- `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx`: add local state for
  whether the modal is shown and a `refreshToken` counter (the exact mechanism `ListPage.jsx`
  already documents for this purpose — "changing it re-runs the fetch (e.g. after a modal
  success...)"). On the modal's `onSuccess`, close it and bump `refreshToken`; pass
  `refreshToken` through to `<ListPage refreshToken={refreshToken} ... />`.
- `StlModelsHelper.jsx`: change `#renderNewButton` from a `NewButton href="#/stl_models/new"`
  link into a button that opens the modal (`onClick`) instead of navigating. `NewButton.jsx`
  currently only supports `href`-as-anchor; either extend it with an optional `onClick` variant
  (styled identically) or render a plain `btn btn-primary mb-3` button locally here — pick
  whichever keeps `NewButton`'s existing callers (treasures, games, etc., which still navigate)
  unaffected.

### Step 7 — Update specs

- `frontend/specs/assets/js/utils/routing/HashRouteResolverSpec.js`: update expectations for the
  rescoped `stlModel`/`stlModels` paths and the removed `stlModelNew` route.
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/navLinksSpec.js`:
  update the expected STL models nav href.
- Remove/replace `StlModelNewSpec.js`, `StlModelNewHelperSpec.js`, and the
  `StlModelNewController/` spec folder (`buildEffectSpec.js`,
  `submitFormSpec.js`/`submitFormPhotoUploadSpec.js`, `retryPhotoUploadSpec.js`, `support.js`)
  with equivalents scoped to the new modal component/helper and the adapted controller (minus
  the removed `buildEffect`, plus the new `onSuccess`-callback behavior instead of redirect
  assertions).
- `StlModelsSpec.js` / `StlModelsHelperSpec.js`: cover the new-button-opens-modal behavior and
  the `refreshToken` bump on modal success.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js`: update the `stlModel`/
  `stlModels` path expectations (currently asserts against `#/stl_models` / `#/stl_models/1`) and
  drop any `stlModelNew` coverage.

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — rescope/remove routes.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — drop `stlModelNew` page-map entry/import.
- `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx` — modal state + `refreshToken`.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx` — `basePath`, new-button behavior.
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — delete.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` — repurpose into the modal helper, or delete once superseded.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js` — drop `buildEffect`, swap redirects for an `onSuccess` callback.
- New: `.../stl_model/pages/elements/StlModelNewModal.jsx` and `.../helpers/StlModelNewModalHelper.jsx` (naming/location to taste, matching the `elements/`+`helpers/` split already used elsewhere in this resource folder).
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — nav link path.
- Spec files listed in Step 7.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no new keys are expected, but run it since `stl_model_new_page`/`stl_models_page` usage sites move.

## Notes

- No backend, API, or translation-key changes are expected — the existing STL model create
  endpoint and all relevant `stl_model_new_page.*`/`stl_models_page.*` i18n keys (en/pt, already
  in sync) are reused as-is.
- The exact split between "extend `NewButton` with an `onClick` variant" vs. "render a local
  button in `StlModelsHelper`" (Step 6) and the exact new-file naming/location (Step 4) are left
  as implementation judgment calls — the important constraint is not disturbing `NewButton`'s
  other (still page-navigating) callers.
- Double-check for any other `#/stl_models` / `/stl_models` literal beyond the ones already
  identified (`StlModelsHelper.jsx`'s `basePath`, `HeaderHelper.jsx`'s nav link,
  `StlModelNewController.js`'s redirects) before considering the rescoping complete.
