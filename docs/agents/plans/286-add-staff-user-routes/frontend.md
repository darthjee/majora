# Frontend Plan: Add staff user routes

Main plan: [plan.md](plan.md)

## Shared contracts

- Depends on `backend.md` shipping: `is_staff` in `GET /users/status.json`, and the four
  `/staff/users*` endpoints described in `plan.md`'s "Shared contracts" table. Field names are
  `name` and `email` (never `username`).
- Produces: three new hash routes (`/staff/users`, `/staff/users/:id`, `/staff/users/:id/edit`)
  and a nav link, all gated on `is_superuser || is_staff`.
- New translation keys needed for these pages/nav-link are defined and added by `translator.md`
  — reference keys by name here (e.g. `staff_users_page.*`) without inventing the wording
  yourself; coordinate the key list with the translator plan below.

## Implementation Steps

### Step 1 — Extend auth status plumbing with `is_staff`

- `frontend/assets/js/utils/AdminAccess.js`: add a new static method, e.g.
  `isStaffOrSuperUser(client)`, that reads `data.is_superuser` **or** `data.is_staff` from the
  `status.json` response (same try/catch/response.ok shape as the existing `isSuperUser`).
  Keep `isSuperUser` unchanged (still used as-is by the existing Treasures pages).
- `frontend/assets/js/components/elements/controllers/HeaderController.js`: add a
  `setIsStaff` setter param (constructor + `checkStatus`) mirroring `setIsSuperUser`, reading
  `Boolean(data.is_staff)`.
- `frontend/assets/js/components/elements/Header.jsx`: add `isStaff` state, wire it into the
  controller and into `HeaderHelper.render`'s state object.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`: add a new
  `#renderStaffUsersNavLink(state)` private method (or extend `#renderTreasuresNavLink`'s
  condition to `isSuperUser || isStaff` and add a second link next to it) that renders
  `<Nav.Link href="#/staff/users">{Translator.t('header.nav_staff_users')}</Nav.Link>` when
  `state.isSuperUser || state.isStaff`.

### Step 2 — Add a staff user HTTP client

New `frontend/assets/js/client/StaffUserClient.js` extending `BaseClient`, following
`TreasureClient.js`'s shape (raw `Response`-returning methods, `Authorization: Token <token>`
header when a token is present):

- `fetchUsers(token, params)` — GET `/staff/users.json` (accept pagination query params the
  same way `GenericClient.fetchIndex` builds them, or accept a pre-built `URLSearchParams`
  from the caller — check `HashRouteResolver#getPaginationParams` for the existing helper
  before reinventing it).
- `fetchUser(id, token)` — GET `/staff/users/${id}.json`.
- `updateUser(id, token, fields)` — PATCH `/staff/users/${id}.json`.
- `fetchRecoveryLink(id, token)` — POST `/staff/users/${id}/recovery-link.json` (no body).

### Step 3 — Add a generic table element

No generic table-rendering component exists yet (checked `frontend/assets/js/components/elements/`).
Add `frontend/assets/js/components/elements/Table.jsx`, a small presentational component
taking `columns` (array of `{ key, label }`) and `rows` (array of row objects) plus an optional
per-row actions renderer, following the style of existing simple elements like `Pagination.jsx`
(props in, JSX out, no internal state/fetching). Keep it generic — do not couple it to the User
shape — so it can be reused later.

### Step 4 — Add the three pages (mirror the Treasures index/edit pattern exactly)

For each page, add a `controllers/*Controller.js` (state + effect + submit logic) and a
`helpers/*Helper.jsx` (pure rendering), plus the page component itself, matching
`TreasuresController.js`/`TreasuresHelper.jsx`/`Treasures.jsx` and
`TreasureEditController.js`/`TreasureEditHelper.jsx`/`TreasureEdit.jsx` 1:1 in structure:

- `StaffUsers.jsx` + `controllers/StaffUsersController.js` + `helpers/StaffUsersHelper.jsx`:
  - Effect: redirect to `/` if `!isStaffOrSuperUser` (via `AdminAccess.isStaffOrSuperUser`,
    same redirect pattern as `TreasuresController.buildEffect`); otherwise fetch
    `StaffUserClient.fetchUsers` and render via the new `Table` element — columns: name,
    email, an edit link (`#/staff/users/:id/edit`), and a "generate/copy recovery link"
    action button per row.
  - Recovery-link action: on click, call `StaffUserClient.fetchRecoveryLink(id, token)`; on
    success, reveal the returned `url` in the row (e.g. a text field) plus a copy-to-clipboard
    button (`navigator.clipboard.writeText`); on failure, show an inline error. Keep this
    per-row state local to the controller (e.g. a map of `userId -> { url, status }`), not a
    new full-page fetch.
  - Include pagination (reuse the `Pagination` element, same as `TreasuresHelper`).
- `StaffUser.jsx` + `controllers/StaffUserController.js` + `helpers/StaffUserHelper.jsx`: show
  page for a single user (name, email, edit link), same redirect-gate pattern, mirroring
  `Treasure.jsx`/`TreasureController.js`/`TreasureHelper.jsx`.
- `StaffUserEdit.jsx` + `controllers/StaffUserEditController.js` + `helpers/StaffUserEditHelper.jsx`:
  edit form for `name` + `email` only, mirroring `TreasureEdit.jsx` /
  `TreasureEditController.js` / `TreasureEditHelper.jsx` exactly (including `FormField`,
  `SubmitButton`, `fieldErrors` handling, and redirect-on-success to `#/staff/users/:id`).

### Step 5 — Register routes

- `frontend/assets/js/utils/HashRouteResolver.js`: register, in the same style as the
  existing `treasures` block:
  ```js
  this.#router.register('/staff/users/:id/edit', 'staffUserEdit');
  this.#router.register('/staff/users/:id', 'staffUser');
  this.#router.register('/staff/users', 'staffUsers');
  ```
  (register the more specific `:id/edit` route before the bare `:id` route, matching the
  existing `/treasures/:id/edit` before `/treasures/:id` ordering.)
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import the three new page
  components and add `staffUsers`, `staffUser`, `staffUserEdit` entries to the `PAGES` map.

### Step 6 — Specs

Add Jasmine specs under `frontend/specs/` mirroring the source tree 1:1 (per
`docs/agents/frontend.md` conventions) for every new file in Steps 1-5: `AdminAccess`
extension, `HeaderController`/`HeaderHelper` additions, `StaffUserClient`, `Table`, the three
pages + their controllers/helpers, and the `HashRouteResolver`/`AppHelper` registrations.
Cover: staff-vs-non-staff redirect behavior, list rendering + pagination, recovery-link
generate/reuse/copy flow, edit form validation-error display, and nav link visibility for
`isStaff`, `isSuperuser`, and neither.

## Files to Change

- `frontend/assets/js/utils/AdminAccess.js` — add staff-or-superuser check.
- `frontend/assets/js/components/elements/controllers/HeaderController.js`,
  `Header.jsx`, `helpers/HeaderHelper.jsx` — `is_staff` plumbing + nav link.
- `frontend/assets/js/client/StaffUserClient.js` — new client.
- `frontend/assets/js/components/elements/Table.jsx` — new generic table element.
- `frontend/assets/js/components/pages/StaffUsers.jsx`, `StaffUser.jsx`, `StaffUserEdit.jsx`
  and their `controllers/`/`helpers/` counterparts — new pages.
- `frontend/assets/js/utils/HashRouteResolver.js` — register new routes.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register new page components.
- `frontend/specs/**` — new/updated specs mirroring all of the above.

## CI Checks

- `frontend/`: `docker-compose run majora_fe npm test` (CI job: frontend tests).
- `frontend/`: `docker-compose run majora_fe npm run lint` (CI job: frontend lint).

## Notes

- Reuse `AdminAccess.isSuperUser` as-is for the existing Treasures pages; do not change its
  behavior. Add the new staff-or-superuser check as a separate method (or a second exported
  helper) so existing superuser-only pages are unaffected.
- Do not build a one-off table just for this feature if it can be reasonably generalized —
  the issue explicitly calls out that no generic table element exists yet and asks for one.
- Wait for the exact key names from `translator.md` before hardcoding `Translator.t(...)` calls
  in the new helpers — coordinate rather than guessing.
