# Frontend Plan: Refactor permissions and access request for future caching

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend's new `access.json` field and `permissions.json` request contract described in the main plan:
- `access.json` responses gain `is_logged: boolean` (never `null`).
- `permissions.json`'s `?role=` accepts a new `logged` value, alongside `superuser`, `dm`, `owner`, `staff`, `player`.
- Produces: the frontend now always sends an explicit role set on every `permissions.json` request (derived from the corresponding `access.json` response, or from the mock "view as" facade), except the new "Not Logged" mock case, which deliberately sends zero role params.

## Implementation Steps

### Step 1 — Add `is_logged` to the fail-closed default

In `frontend/assets/js/utils/access/store/AccessStoreAccess.js`, add `is_logged: false` to `ACCESS_DEFAULT` — the safe/anonymous value while a fetch is pending or has failed, consistent with `is_player`/`is_owner`'s existing `false` default (not `null`, since `is_logged` is never `null` from the backend either).

### Step 2 — Add a role-derivation helper

Add a small helper mapping an access payload's booleans to the backend's `?role=` vocabulary: `is_superuser`->`'superuser'`, `is_staff`->`'staff'`, `is_dm`->`'dm'`, `is_player`->`'player'`, `is_owner`->`'owner'`, `is_logged`->`'logged'` — include a name only when its value is truthy (treat `null`, e.g. an unauthenticated `is_superuser`, as falsy same as `false`). Where this lives (a new small file next to `AccessStoreKeys.js`, or a static method on an existing class) is your call — keep it near the other `AccessStore*` helpers.

### Step 3 — Extend `AccessStoreFacade` with "Not Logged" and centralize the mock-vs-real role decision

In `frontend/assets/js/utils/access/store/AccessStoreFacade.js`:
- Add `#notLogged = false` alongside `#enabled`/`#roles`/`#gameSlug`; thread it through `get()`, `set(enabled, roles, notLogged, gameSlug)`, and `clear()`.
- Replace `effectiveRoles(roles)` with a method taking the caller's *real, derived* roles (Step 2's output) instead of the historically-always-empty caller-supplied array — e.g. `rolesForPermissionsRequest(realRoles)`:
  - facade disabled -> return `realRoles` unchanged (the new, always-populated real-identity path).
  - facade enabled && `#notLogged` -> return `[]` (explicit anonymous mock — "When Not Logged is on, the permissions request will be set without a role").
  - facade enabled && !`#notLogged` -> return `[...Array.from(#roles), 'logged']` (always add `logged` when mocking, per the issue — "By default, when mocking roles, the permissions request should add the role logged" — regardless of whether any of dm/player/owner are also picked).
- This drops the old `#roles.size > 0` gate: a facade that's `enabled` now always overrides, instead of silently falling through to the real path when no dm/player/owner checkbox is picked (that combination now correctly means "a plain logged-in user with no special role", i.e. `['logged']`).

### Step 4 — Wire real-role derivation into every `ensure*Permissions`/`get*Permissions` call

In `frontend/assets/js/utils/access/store/AccessStorePermissions.js`: `ensureGame`/`ensureCharacter`/`ensureTreasure` and `getGame`/`getCharacter`/`getTreasure` currently compute `roleSet` from the caller-supplied `roles` argument (always `[]` in practice — confirmed no call site anywhere passes a non-empty array). Instead:
1. Read the resource's own cached Access payload synchronously (`AccessStoreAccess.getGame(cache, gameSlug)` / `getCharacter(...)` / `getTreasure(...)` — no fetch, just a cache read) and derive real roles from it (Step 2).
2. Pass those into `AccessStoreFacade.rolesForPermissionsRequest(realRoles)` (Step 3) to get the final `roleSet`.

**Critical**: apply this identically in both the `ensure*` (async, may trigger a fetch) and `get*` (sync cache read) variants, via one shared private helper — if the two computed the role set differently, the cache keys (`AccessStoreKeys.*Permissions(...)`) would diverge and the synchronous `get*` readers (e.g. `GameController.js:98`, `TreasureController.js:87`, `GameSessionController.js:93`) would always miss and fall back to `PERMISSIONS_DEFAULT`.

Since no call site passes a real `roles` argument today, the public `ensure*Permissions`/`get*Permissions` parameter can be dropped (update `AccessStore.js`'s matching methods and `AccessStoreDescriptor.js` in Step 5) or left as a now-vestigial override hook — your call, but grep every call site first to confirm before removing it.

### Step 5 — Sequence access before permissions in the route-level descriptor

In `frontend/assets/js/utils/access/store/AccessStoreDescriptor.js`: `#ensureGame`, `#ensureTreasure`, `#ensureCharacter` currently fire `ensure*Access` and `ensure*Permissions` in parallel via `Promise.all`. Change to sequential — await `ensure*Access` first, then call `ensure*Permissions` — since the real roles for that route's first Permissions fetch depend on the Access response having already resolved (Step 4 reads it synchronously from cache, so it must already be populated by then). Every later ad-hoc `ensure*Permissions` call from an individual page controller then trivially reads the same already-resolved Access entry.

### Step 6 — Add "Not Logged" to the mock modal

- `frontend/assets/js/components/common/modals/helpers/ViewAsModalHelper.jsx`: render a new switch (`Translator.t('view_as_modal.not_logged_label')`) above the "Game Master" checkbox, inside the existing `enabled` `Collapse`. Wrap the `ROLES.map(...)` checkbox list in its own nested `Collapse in={state.enabled && !state.notLogged}`, so it hides exactly when "Not Logged" is on.
- `frontend/assets/js/components/common/modals/controllers/ViewAsModalController.js`: add `handleToggleNotLogged()` (mirrors `handleToggleEnabled`); thread `notLogged` through `handleSave(enabled, roles, notLogged, gameSlug)` -> `AccessStore.setFacade({ enabled, roles, notLogged, gameSlug })`.
- `frontend/assets/js/components/common/modals/ViewAsModal.jsx`: add `notLogged` local state (seeded from `AccessStore.getFacade().notLogged`), thread it through the helper's `state`/handlers and into `controller.handleSave(...)`.
- `frontend/assets/js/utils/access/store/AccessStore.js`: `getFacade()`/`setFacade({enabled, roles, notLogged, gameSlug})` pass `notLogged` through to `AccessStoreFacade` (Step 3).

### Step 7 — i18n key

The new `view_as_modal.not_logged_label` translation key is added by the translator plan ([translator.md](translator.md)) — do not add it here; just reference the same key name from Step 6.

## Files to Change

- `frontend/assets/js/utils/access/store/AccessStoreAccess.js` — `ACCESS_DEFAULT.is_logged`
- `frontend/assets/js/utils/access/store/AccessStoreFacade.js` — `#notLogged`, `rolesForPermissionsRequest`
- `frontend/assets/js/utils/access/store/AccessStorePermissions.js` — real-role derivation, shared `ensure*`/`get*` helper
- `frontend/assets/js/utils/access/store/AccessStoreDescriptor.js` — sequential access-then-permissions
- `frontend/assets/js/utils/access/store/AccessStore.js` — `setFacade`/`getFacade` `notLogged` passthrough
- `frontend/assets/js/components/common/modals/helpers/ViewAsModalHelper.jsx` — "Not Logged" switch
- `frontend/assets/js/components/common/modals/controllers/ViewAsModalController.js` — `handleToggleNotLogged`
- `frontend/assets/js/components/common/modals/ViewAsModal.jsx` — `notLogged` state
- (new) role-derivation helper file, if split out (Step 2)
- Matching Jasmine specs under `frontend/specs/` for every file above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `BaseClient.js`'s `#shouldSkipCache` special-case for `/permissions.json` (skip cache only when no `role` param) needs **no code change**: once roles are always sent for the real path, it already treats every real request as cacheable, matching the backend's now-always-`X-Force-Public-Cache` behavior. The one case it still marks skip-cache (the "Not Logged" mock, which deliberately sends zero role params) is a minor missed optimization, not a correctness bug — leaving it alone is consistent with "changes in the cache" being out of scope for this issue.
- Before dropping the `roles` parameter in Step 4, grep every `ensure*Permissions`/`get*Permissions` call site again to confirm none pass a non-empty array (true as of this plan's writing).
