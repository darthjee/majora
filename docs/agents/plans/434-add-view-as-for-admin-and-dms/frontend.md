# Frontend Plan: Add view as for admin and DMs

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md) for the new translation keys this consumes. No backend contract
changes — this builds entirely on #433's already-planned `permissions.json`/`role`
interface.

## Step 1 — `AccessStore` facade state

`frontend/assets/js/utils/AccessStore.js`:

- Add module-level facade state: `_facadeEnabled` (bool, default `false`) and
  `_facadeRoles` (a `Set<string>`, default empty; valid members `'dm'`, `'player'`,
  `'owner'`).
- Add `getFacade()` — synchronous read of `{ enabled: _facadeEnabled, roles:
  Array.from(_facadeRoles) }`, used to pre-populate the modal when it opens.
- Add `setFacade({ enabled, roles })`:
  - Updates `_facadeEnabled`/`_facadeRoles`.
  - Calls the existing `reset()` (aborts in-flight requests, clears the per-resource
    cache) then re-runs `syncForRoute(_pageKey, _hash)` for the current page — this
    naturally re-fetches every per-resource check under the new facade and re-emits
    `AccessEvents` as each resolves, satisfying the issue's "should trigger the event as
    if it had just received access information" without a separate emit path.
  - Does **not** touch `SUPERUSER_KEY`/`STAFF_KEY` cache entries — those stay real
    (see Step 3).
- Add `isReallyAdminOrStaff()` — a thin wrapper that resolves the same way
  `ensureStaffOrSuperUser()` already does (real `/users/status.json`-backed check,
  cached under `STAFF_KEY`), for the header button's visibility. This consolidates the
  "real, facade-independent" concept the issue calls for into `AccessStore`, rather than
  Header's own separate `/users/status.json` call (see Step 3).
- `reset()`/`syncForRoute()` (page navigation) must leave `_facadeEnabled`/`_facadeRoles`
  untouched — only `setFacade()` and `syncForAuthChange()` change them. On
  `syncForAuthChange()` (login/logout), reset the facade back to disabled/empty before
  re-syncing — a new auth session should not inherit a stale facade from a previous
  session.

## Step 2 — Thread the facade into every per-resource fetch

`ensureGameAccess`/`ensureCharacterAccess`/`ensureTreasureAccess` and the
`ensureGamePermissions`/`ensureCharacterPermissions`/`ensureTreasurePermissions` methods
introduced by #433 must pass `Array.from(_facadeRoles)` as the `role` query param
whenever `_facadeEnabled` is `true` and `_facadeRoles` is non-empty; otherwise, no `role`
param (real-identity path, unchanged from #433's default). Cache keys for these methods
already changed shape in #433 to include the roles requested — reuse that same keying so
switching the facade never serves a stale entry from a different facade state (in
addition to the `reset()` call in `setFacade()` above, which is the primary guard).

`ensureSuperUser()`/`ensureStaffOrSuperUser()` (and by extension `isSuperUser()`/
`isStaffOrSuperUser()`) are untouched — per the issue's agreed scope, the facade never
affects real admin/staff status or anything gated on it (nav links, `TreasuresController`
-style page guards).

## Step 3 — Header button

- `frontend/assets/js/utils/Icons.js` — add `viewAs: 'bi-file-person-fill'`.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — inside
  `#renderAuthControl`'s logged-in branch (next to the existing `my-account-link`, see
  lines ~155-180), add a new `Nav.Link` rendering `<i className={`bi ${Icons.viewAs}`}
  aria-hidden="true" title={Translator.t('header.view_as_alt')}></i>`, gated on a new
  `state.canViewAs` (or similarly named) boolean — visible only when `true`. Clicking it
  opens the new `ViewAsModal` (local `showViewAsModal` state, same pattern as the
  existing login modal's `showModal`).
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — replace (or
  supplement) the existing direct `/users/status.json`-derived `isSuperUser`/`isStaff`
  state with a call to `AccessStore.isReallyAdminOrStaff()` for the new button's gating,
  per the issue's explicit ask for "a specific method... just for the button in the
  header." Leave the existing `isSuperUser`/`isStaff` state as-is if other parts of
  `HeaderHelper` still depend on them directly (e.g. `#renderTreasuresNavLink`,
  `#renderStaffUsersNavLink`, `#renderServerStatus`) — only the new button needs the new
  method; no need to migrate the other nav-link gates in this issue.
- `frontend/assets/js/components/elements/Header.jsx` — add `showViewAsModal` state and
  mount `<ViewAsModal>` alongside the existing `<LoginModal>`.

## Step 4 — `ViewAsModal` component

Follow the three-file convention used by `PhotoUploadModal`/`SlainConfirmModal`
(`Component.jsx` + `controllers/XController.js` + `helpers/XModalHelper.jsx`, each
importing `react-bootstrap/cjs/Modal.js` directly — there is no shared modal wrapper):

- `frontend/assets/js/components/elements/ViewAsModal.jsx` — owns local state for the
  in-progress edit (`enabled`, `roles`), initialized from `AccessStore.getFacade()` each
  time the modal opens (`show` prop toggling), builds a `ViewAsModalController` via
  `useMemo`.
- `frontend/assets/js/components/elements/controllers/ViewAsModalController.js` —
  `handleToggleEnabled`, `handleToggleRole(role)`, `handleCancel` (calls `onClose` prop
  without touching `AccessStore`), `handleSave` (calls `AccessStore.setFacade({ enabled,
  roles })` then `onClose`).
- `frontend/assets/js/components/elements/helpers/ViewAsModalHelper.jsx` — `<Modal
  show={show} onHide={handlers.onCancel}>` with `Modal.Header`/`Modal.Body`/
  `Modal.Footer`; body has one `form-check` checkbox (see
  `GameNpcNewHelper.jsx:68-79`'s pattern) for "facade enabled," then one `form-check`
  checkbox per role (`dm`, `player`, `owner`), each labeled via
  `Translator.t('view_as_modal.role_dm' | 'role_player' | 'role_owner')`; footer has
  `<button className="btn btn-secondary">Cancel</button>` /
  `<button className="btn btn-primary">Save</button>` wired to
  `handlers.onCancel`/`handlers.onSave`, same convention as `PhotoUploadModalHelper.jsx`.

## Files to Change

- `frontend/assets/js/utils/AccessStore.js` — facade state, `getFacade`/`setFacade`/
  `isReallyAdminOrStaff`, thread roles into per-resource fetches
- `frontend/assets/js/utils/Icons.js` — add `viewAs`
- `frontend/assets/js/components/elements/Header.jsx` — modal-open state
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — real
  admin/staff check via `AccessStore.isReallyAdminOrStaff()`
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — new nav button
- `frontend/assets/js/components/elements/ViewAsModal.jsx` — new
- `frontend/assets/js/components/elements/controllers/ViewAsModalController.js` — new
- `frontend/assets/js/components/elements/helpers/ViewAsModalHelper.jsx` — new
- `frontend/specs/...` — new/updated specs mirroring every file above

## CI Checks

- `frontend/`: `npm test` (Jasmine specs)
- `frontend/`: `npm run lint`

## Notes

- Do not start until #433's frontend half (`ensure*Permissions`, the `role`-aware cache
  keying) is merged — this plan's Step 2 depends directly on it.
- Facade scope is per-resource only (per the discuss-issue conversation): nav-link
  visibility and admin-only page guards (`TreasuresController`, `StaffUsersController`,
  etc.) are intentionally left untouched by this issue.
