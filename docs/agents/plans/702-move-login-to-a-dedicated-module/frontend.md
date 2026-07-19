# Frontend Plan: Move login to a dedicated module

Main plan: [plan.md](plan.md)

## Shared contracts

None to produce or consume — see [plan.md](plan.md)'s "Shared contracts". `AuthClient` and every
`/users/*.json` call it makes are untouched; this is purely a file-location move for
`LoginModal` and its controller/helper.

## Context

`MyAccount`, `Register`, and `RecoverPassword` pages already live together under
`frontend/assets/js/components/resources/account/pages/` (each with its own
`pages/controllers/*Controller.js` and `pages/helpers/*Helper.jsx`). `LoginModal`, however,
currently lives separately under `frontend/assets/js/components/common/modals/`, alongside
unrelated modals (`MoneyEditModal`, `PhotoUploadModal`, `PhotoViewModal`,
`ProfilePhotoSetModal`, `TaskDetailModal`, `ViewAsModal`):

- `components/common/modals/LoginModal.jsx`
- `components/common/modals/controllers/LoginModalController.js`
- `components/common/modals/helpers/LoginModalHelper.jsx`

Only one external file imports it: `components/common/header/helpers/HeaderHelper.jsx` (line 7:
`import LoginModal from '../../modals/LoginModal.jsx';`, plus its JSX usage further down).

Matching Jasmine specs mirror the current location:
- `specs/assets/js/components/common/modals/LoginModalSpec.js`
- `specs/assets/js/components/common/modals/controllers/LoginModalController/*.js`
- `specs/assets/js/components/common/modals/helpers/LoginModalHelper/*.js`

`docs/agents/frontend.md` documents `modals/` as including `LoginModal` (line 72) and describes
`account` as covering only "my-account, register, recover-password" (line 100).

## Implementation Steps

### Step 1 — Move LoginModal's files into the `account` resource

Unlike `MyAccount`/`Register`/`RecoverPassword`, `LoginModal` is not a routed page (it's a modal
opened from the header), so it doesn't belong inside `account/pages/`. Move it as a sibling of
`pages/` within the `account` resource folder instead — this keeps every directory exactly as
deep as it is today (`components/common/modals/...` and `components/resources/account/...` are
both two levels under `components/`), so none of the three moved files need their own internal
relative-import paths changed:

- `components/common/modals/LoginModal.jsx` → `components/resources/account/LoginModal.jsx`
- `components/common/modals/controllers/LoginModalController.js` →
  `components/resources/account/controllers/LoginModalController.js`
- `components/common/modals/helpers/LoginModalHelper.jsx` →
  `components/resources/account/helpers/LoginModalHelper.jsx`

### Step 2 — Update the one external import

In `components/common/header/helpers/HeaderHelper.jsx`, change:
```js
import LoginModal from '../../modals/LoginModal.jsx';
```
to:
```js
import LoginModal from '../../../resources/account/LoginModal.jsx';
```
(`header/helpers/` → `common/` is 2 levels up; reaching `resources/account/` from there needs a
3rd `../` up to `components/`, then down into `resources/account/`.)

### Step 3 — Move the specs

- `specs/assets/js/components/common/modals/LoginModalSpec.js` →
  `specs/assets/js/components/resources/account/LoginModalSpec.js`
- `specs/assets/js/components/common/modals/controllers/LoginModalController/` →
  `specs/assets/js/components/resources/account/controllers/LoginModalController/`
- `specs/assets/js/components/common/modals/helpers/LoginModalHelper/` →
  `specs/assets/js/components/resources/account/helpers/LoginModalHelper/`

Check each spec file's own relative imports (e.g. of `LoginModalController.js`/
`LoginModalHelper.jsx`/test helpers) and adjust for the new depth the same way as Step 1 — since
the move preserves depth for the source files, spec files that mirrored that depth need the same
"same depth" treatment, but double check any spec importing something from `common/` (e.g. shared
test helpers) since those now need one extra `../`.

### Step 4 — Update documentation

In `docs/agents/frontend.md`:
- Line 72: drop `LoginModal` from the `modals/` bullet's example list.
- Line 100: extend the `account` resource description to
  `account (my-account, register, recover-password, login)`.
- Around line 66-67, note that `account/` now also has a top-level `LoginModal.jsx` +
  `controllers/`/`helpers/` alongside its `pages/` subfolder (since `LoginModal` isn't a routed
  page).

## Files to Change

- `frontend/assets/js/components/resources/account/LoginModal.jsx` (new, moved)
- `frontend/assets/js/components/resources/account/controllers/LoginModalController.js` (new, moved)
- `frontend/assets/js/components/resources/account/helpers/LoginModalHelper.jsx` (new, moved)
- `frontend/assets/js/components/common/modals/LoginModal.jsx` (deleted)
- `frontend/assets/js/components/common/modals/controllers/LoginModalController.js` (deleted)
- `frontend/assets/js/components/common/modals/helpers/LoginModalHelper.jsx` (deleted)
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — import path update
- `frontend/specs/assets/js/components/resources/account/LoginModalSpec.js` (new, moved)
- `frontend/specs/assets/js/components/resources/account/controllers/LoginModalController/` (new, moved)
- `frontend/specs/assets/js/components/resources/account/helpers/LoginModalHelper/` (new, moved)
- `frontend/specs/assets/js/components/common/modals/LoginModalSpec.js` and its
  `controllers/LoginModalController/`, `helpers/LoginModalHelper/` (deleted)
- `docs/agents/frontend.md` — documentation update

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs every spec under `specs/`, including
  the moved `LoginModal` specs and `HeaderHelper`'s existing specs.
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

Run locally via `docker-compose run --rm majora_fe yarn test` and
`docker-compose run --rm majora_fe yarn lint` (per `AGENTS.md`'s convention of always running
through Docker).

## Notes

- No `AuthClient`, routing, or i18n changes are needed — this step touches only file locations
  and the one import path in `HeaderHelper.jsx`.
- Double-check ESLint import-order/path rules (`eslint.config.mjs`) don't flag the new relative
  path depth in `HeaderHelper.jsx`.
