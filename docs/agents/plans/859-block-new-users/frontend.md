# Frontend Plan: Block new users

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section. This agent consumes everything there and is responsible for choosing (and recording back into this file) the exact i18n key names it needs from the translator agent.

## Implementation Steps

### Step 1 — Status badges for the staff users page

Add a `StaffUserStatusBadges` class next to `StaffUsersHelper`, mirroring `AuthorizationRequestStatusBadges` (`frontend/assets/js/components/common/list_types/AuthorizationRequestStatusBadges.js`): a `STATUS_VARIANTS` map and a `static build(status)` returning `{variant, text}`. Map `pending → warning` (yellow), `approved → success` (green), `denied → danger` (red) — these are Bootstrap's stock variants, no custom SCSS class needed (unlike `authorization-logged`, which needed one because Bootstrap has no stock "darker blue"). `text` comes from `Translator.t('staff_users_page.status_' + status)`.

### Step 2 — Extend `StaffUsersHelper.jsx`'s columns

In `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx`, add to the `columns` array (currently just `name`/`email`, `StaffUsersHelper.jsx:27-30`):
- `display_name` column (`staff_users_page.display_name_column`).
- `status` column (`staff_users_page.status_column`), rendered via a `Badge` component (`frontend/assets/js/components/common/badges/Badge.jsx` — same primitive `AuthorizationRequestStatusBadges` pairs with) fed by Step 1's `StaffUserStatusBadges.build(user.status)`.

Add Approve/Deny row actions alongside the existing Edit/recovery-link actions (`#renderRowActions`, `StaffUsersHelper.jsx:80-91`): show "Approve" only when `user.status === 'pending'`; show "Deny" always (per the issue, denying an already-approved user is how bans work). Wire them to new `onApprove`/`onDeny` handlers passed down the same way `onGenerateRecoveryLink`/`onCopyRecoveryLink` already are.

### Step 3 — Approve/Deny requests

In `frontend/assets/js/utils/requests/config/staffUserConfig.js`, add two new `POST` quantity types (paths have no dynamic segment, unlike `recoveryLink`):
```js
const approve = { path: () => '/staff/users/approve.json', permission: null };
const deny = { path: () => '/staff/users/deny.json', permission: null };
```
under `POST: { recoveryLink: {...}, approve: { regular: approve, private: approve }, deny: { regular: deny, private: deny } }`.

In `StaffUsersController.js`, add `handleApprove(userId)`/`handleDeny(userId)`, calling `RequestStore.mutate({ componentName: 'StaffUsersController', resource: 'staffUser', method: 'POST', quantityType: 'approve'|'deny', body: { user_id: userId } })` (per the plan's shared contract for the request body shape; `RequestStore.mutate`'s signature is `{componentName, resource, method, quantityType, params, query, body, variantName}` — `RequestStore.js:87-88` — use `body`, not `params`, since there's no path segment to fill). On success, refresh the row/list (either refetch via the existing `#fetchUsers`, or patch the single row in `users` state with the returned updated user — your call, follow whichever pattern reads more consistently with `handleGenerateRecoveryLink`'s per-row state update at `StaffUsersController.js:73-95`).

### Step 4 — Status + search filters

Add a filter element for this page (new `StaffUsersFilters.jsx` + controller/helper), following the existing `PollFilters` pattern (`frontend/assets/js/components/resources/game/pages/elements/PollFilters.jsx` + `controllers/PollFiltersController.js` + `helpers/PollFiltersHelper.jsx`): a `status` select (all/pending/approved/denied) and a single text input for `search`, both read from and written to the hash route via `HashRouteResolver` (`getFilterParams`/param-writing helpers, `frontend/assets/js/utils/routing/HashRouteResolver.js:75,159`).

Wire the resulting `{status, search}` into `StaffUsersController.js`'s `#fetchUsers` (`StaffUsersController.js:115-130`), which currently only spreads `new HashRouteResolver().getPaginationParams()` into `query` — merge in the filter params the same way `PollFiltersController` does for its own page, so `RequestStore.ensure`'s `query` carries `status`/`search` through to `GET /staff/users.json`.

### Step 5 — "Awaiting approval" screen for pending users

`HeaderController.checkStatus()` (`frontend/assets/js/components/common/header/controllers/HeaderController.js:160-182`) is the single place that reads `GET /users/status.json`'s response and derives global auth state (`setLoggedIn`, `setIsSuperUser`, `setIsStaff`). Add a `setPendingApproval` setter (mirroring the existing setter params) and call it with `Boolean(data.status === 'pending')` right alongside the existing `setLoggedIn(Boolean(data.logged_in))` call.

Thread this new piece of state up from `Header.jsx` to wherever page content is conditionally gated on login state (investigate `Header.jsx`'s render tree and whichever top-level component decides what to show for a logged-out visitor — this plan intentionally doesn't prescribe the exact component, since it wasn't traced during planning). Render a dedicated "your account is awaiting approval" view instead of the normal logged-out landing content when `pendingApproval` is true.

## Files to Change

- `frontend/assets/js/components/common/list_types/StaffUserStatusBadges.js` (new, or co-located under `staff_user/`) — status → badge variant/label.
- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx` — columns + approve/deny actions.
- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js` — approve/deny handlers, filter params wiring.
- `frontend/assets/js/utils/requests/config/staffUserConfig.js` — `approve`/`deny` POST config.
- `frontend/assets/js/components/resources/staff_user/pages/elements/StaffUsersFilters.jsx` (new) + `controllers/StaffUsersFiltersController.js` + `helpers/StaffUsersFiltersHelper.jsx` — status/search filter bar.
- `frontend/assets/js/components/common/header/controllers/HeaderController.js` — `pendingApproval` state from `/users/status.json`.
- `frontend/assets/js/components/common/header/Header.jsx` and whichever top-level component gates content on login state — render the pending-approval screen.
- Jasmine specs alongside every file above, under `frontend/specs/` mirroring the `assets/js/` path.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `checks`/`frontend-checks`)

## Notes

- Step 5's "where does global logged-out content get gated" was not traced to a specific file during planning — `Header.jsx` is the confirmed entry point for the state, but the actual conditional render may live in `Header.jsx` itself or a parent `App`-level component. Resolve this as part of implementation.
- Confirm the exact chosen i18n namespace/keys for the pending-approval screen with the translator agent once decided (see `translator.md`).
