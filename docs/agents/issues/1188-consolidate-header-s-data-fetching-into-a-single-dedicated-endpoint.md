# Issue: Consolidate Header's data-fetching into a single dedicated endpoint

## Description

Spun off from #1186 while enhancing it. `Header` currently resolves its rendering state through several independent client calls:

- `HeaderController#checkStatus` → `AuthClient`'s `/users/status.json` → `loggedIn`, `isSuperUser`, `isStaff`, `pendingApproval`.
- `HeaderGameAccessController` → `AccessStore.ensureGameAccess(gameSlug)` → `gameAccess` (`is_dm`/`is_player`/`is_superuser`/`is_staff`), only when on a game-scoped route.
- `HeaderViewAsController#checkAvailability` → a separate call resolving `canViewAs`.
- `AccessStore.getFacade()` → `facadeEnabled`.

A single header-scoped endpoint returning the route-independent identity fields `Header` needs in one response would collapse the first and third of these into one request (see Solution for exactly what's in/out of scope).

Independent, non-blocking relative to #1186 (config-driven registry for Header's controls): that issue is a frontend rendering-structure exploration, this one is a backend/data-fetching change. Either can proceed without the other.

## Problem

Beyond the redundant round-trips, there's an existing inconsistency worth fixing at the same time. Note this is *not* a divergent-truth problem — `AccessStore.ensureStaffOrSuperUser()` (aliased as `isReallyAdminOrStaff()`) already calls the very same `/users/status.json` endpoint as `HeaderController#checkStatus`; both ultimately read `request.user.is_staff`/`is_superuser` server-side (`backend/accounts/views/auth/status.py`). The duplication is two independent **frontend call paths** to the same backend truth — one uncached (`HeaderController`), one cached under `admin:staff` (`AccessStoreAdmin`) — not two different sources of truth. A dedicated header endpoint collapses these into one call path.

## Expected Behavior

- One backend endpoint, scoped to the header's own route-independent needs (`loggedIn`, `isSuperUser`, `isStaff`, `pendingApproval`, `cacheToken`), replacing `HeaderController#checkStatus` and `HeaderViewAsController`'s separate fetch — see Solution for what stays out of scope (`gameAccess`, `AccessStore.ensureStaffOrSuperUser()`).
- `canViewAs` is derived client-side from the new endpoint's `isSuperUser`/`isStaff` rather than fetched separately.
- End-user-visible header behavior is unchanged; what changes is the data-fetching path feeding it. See Solution's "Edge cases" for the specific existing behaviors (anonymous responses, pending-approval short-circuit, `AuthEvents`/`recheckAuthState` propagation, facade independence, silent error handling) that must carry over unchanged.

## Solution

### Scope of the new endpoint

The new header endpoint covers only the **route-independent** identity fields:

```
{loggedIn, isSuperUser, isStaff, pendingApproval, cacheToken}
```

`cacheToken` is required, not optional — see "Security & performance" below for why.

It is identity-resolved (tied to `request.user`, like the existing `access.json` endpoints), *not* role-parameterized/publicly cacheable like the unrelated `/permissions/*.json` family (`backend/permissions/`, issue #926). That family aggregates capability flags (`can_edit`, ...) for a given *role*, independent of the actual caller, which is what makes it safe to cache anonymously — Header's data is inherently per-session identity, so that caching trick doesn't apply here. Structurally, though, both `/permissions/*.json` (`PermissionsBuilder`) and `access.json` (`BaseAccessSerializer`) are good precedents for "one serializer merging several independent checks into a flat response," which the new endpoint should follow.

**Explicitly out of scope / left as-is:**

- **`gameAccess`** stays on the existing `GET /games/<slug>/access.json` (`GameAccessSerializer` / `BaseAccessSerializer`), fetched via `AccessStore.ensureGameAccess(gameSlug)` exactly as `HeaderGameAccessController` does today. Folding it into the header endpoint would mean duplicating the game-scoped `game.has_player(...)` Membership lookup that endpoint already owns, for no real benefit — `AccessStore`/`AccessCache` already serves as the client-side aggregator that unifies it with the rest of Header's state, including the existing render-with-defaults-then-re-render-on-`AccessEvents` behavior for the loading gap.
- **`canViewAs`** is dropped as a field/endpoint entirely. Today `HeaderViewAsController#checkAvailability` resolves it via `AccessStore.isReallyAdminOrStaff()`, which is just `ensureStaffOrSuperUser()` — i.e. `canViewAs` already equals `isSuperUser || isStaff` from the same status data. Once the new endpoint returns those two flags directly, the frontend can derive `canViewAs` locally instead of a separate check.
- **`facadeEnabled`** is unchanged — it's already fully local/synchronous (`AccessStoreFacade`), no backend call today.

### Loading-state handling

No new design needed here: the frontend already has an established pattern (`AccessStore`/`AccessCache`/`AccessEvents`) where components seed `useState` from a synchronous, fail-closed "no access" default, then re-render once the real async fetch resolves or an `AccessEvents` notification fires. `Header.jsx` already does this today for `gameAccess`/`loggedIn`/`isStaff`/`isSuperUser`; the new endpoint plugs into the same convention.

### Permissions

- **Who can call it**: `AllowAny`, unauthenticated included — same as `/users/status.json` today. Header must render correctly for anonymous visitors (`loggedIn: false` etc.), so it can't require auth.
- **`RequestPermissionResolvers`/`RequestStore` variant-picking does not apply.** That mechanism exists for *resource reads* choosing between a `regular` and `restricted`/permission-gated variant (e.g. `pcs/<id>.json` vs `pcs/<id>/full.json`) based on an already-resolved permission. The new endpoint isn't a resource read with tiers — it's an identity *source*, playing the same role `access.json` already does (which is exempt from this rule for the same reason: it's what other permission checks are built from, not a consumer of them).
- **Mutations**: none — pure `GET`, so the `variantName` exception is not applicable.

### Security & performance

- **`X-Skip-Cache` is mandatory, not optional.** Per `docs/agents/access-control/common-rules.md`'s explicit rule for identity-dependent endpoints, the new backend view must set `X-Skip-Cache: true` (like every `access.json` view), **and** its path/suffix must be registered in the frontend's skip-cache config (`BaseClient`'s exact-path/suffix list, the same mechanism `/access.json` uses). Missing either half risks the Tent proxy serving one user's `loggedIn`/`isStaff`/`isSuperUser` to another — a real cross-user data leak, not a style nit.
- **`cacheToken` must be included and wired up.** `/users/status.json` unconditionally re-mints (`get_or_create`) the caller's `CacheToken` on every logged-in response, and `HeaderController#checkStatus` is the routine bootstrap path that hydrates it into `AuthStorage` (`AuthStorage.setCacheToken`) for *any* already-logged-in session that just loads/refreshes a page — not only fresh logins through the login modal. `BaseClient` attaches `X-Cache-Token` on every request once known, and the Tent proxy's `PrivateRequestHasher` buckets every header-less caller into one **shared** cache slot on 3 restricted routes (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`) — documented as unsafe for responses that vary per caller. If the new endpoint drops `cacheToken`, ordinary "already logged in, reload the page" sessions would stop hydrating it, silently regressing those 3 routes into cross-user cache-sharing risk. The new endpoint must return `cacheToken`, and the migration step that swaps `checkStatus` must also call `AuthStorage.setCacheToken(...)`, exactly preserving today's behavior.
- **Reuse, don't reimplement, the resolution logic.** `isStaff`/`isSuperuser` are plain `request.user` flags and `pendingApproval` reuses whatever `UserProfile.status` resolution `status.py` already does (`_build_payload`/`_build_logged_in_payload`). The new endpoint should call into the same helper(s) rather than re-deriving this logic, to avoid divergence and keep the same query cost (no new N+1 risk).
- **Access-control docs must be updated in the same PR.** Per `docs/agents/access-control.md`'s own convention ("when a new model or endpoint is introduced, update the relevant file... in the same PR"), the new endpoint needs a row in `docs/agents/access-control/endpoints.md` (which already documents `/users/status.json` in detail).

### Migration path

Ships as a single PR — the swap is a contained, in-component edit (Header's controllers are plain ES classes hand-instantiated per render inside `Header.jsx`, not Stimulus, no registry indirection), and steps 1-2 below are purely additive with zero regression risk before the cutover in step 3:

1. **Backend, additive**: add the new endpoint (`{loggedIn, isSuperUser, isStaff, pendingApproval, cacheToken}`, `X-Skip-Cache: true`, reusing `status.py`'s existing resolution helpers). Nothing consumes it yet.
2. **Frontend client method, additive**: add a client call for it (registered in the frontend skip-cache config), unwired.
3. **Swap `HeaderController#checkStatus` (+ `recheckAuthState`)** to call the new endpoint instead of `AuthClient#status`, mapping fields into the same existing `setLoggedIn/setIsSuperUser/setIsStaff/setPendingApproval` calls **and** `AuthStorage.setCacheToken(...)` — downstream state/render is otherwise untouched.
4. **Retire `HeaderViewAsController#checkAvailability`'s fetch**, replacing it with a local `isSuperUser || isStaff` derivation from the state set in step 3, then delete the now-dead `AccessStore.isReallyAdminOrStaff()` alias (confirmed single caller).
5. **Leave everything else untouched**: `AccessStore.ensureStaffOrSuperUser()`/`AccessStoreAdmin` (a shared gate used by ~13 other call sites — `StaffDashboardController`, `TreasureEditController`, `CollectionNewController`, `useStaffOrSuperUser.js`, etc. — unifying with it would be a much larger, separate refactor and is out of scope here), `GamePollController`'s direct `authClient.status()` call (unrelated — resolves current user id for poll pre-population), and `/users/status.json` itself (still needed by both of the above).
6. **Update `docs/agents/access-control/endpoints.md`** with the new endpoint's row, in this same PR.

This narrows the issue's original framing: Header gets a single internal source instead of two, but does **not** unify with `ensureStaffOrSuperUser()`'s separate cache path — that stays a distinct, intentionally out-of-scope concern.

### Edge cases

Existing behaviors the new endpoint and its client integration must preserve exactly (`backend/accounts/views/auth/status.py` and `frontend/.../HeaderController.js`):

- **Anonymous/unauthenticated requests**: always `HTTP 200` with `logged_in: false` and falsy `is_staff`/`is_superuser` — never `401`/`403`. `status.py` uses `AllowAny` with no required auth; the new endpoint must match, not introduce an auth-required response.
- **Pending approval**: mutually exclusive with `isStaff`/`isSuperUser` in the response — a pending profile short-circuits (`status.py:46-47`) before those fields are ever computed. The new endpoint must keep this short-circuit.
- **`AuthEvents`/`recheckAuthState` propagation**: `recheckAuthState` only fires when the resolved `loggedIn` value differs from the previous one, driven by `AuthEvents` emitted after every status check, on logout, and on login/registration success. The new endpoint's client integration must keep emitting `AuthEvents` the same way, or login/logout state won't propagate to the rest of the app (`RequestStore`, `AppController`, etc. also subscribe).
- **Facade ("view as") independence**: confirmed safe to derive `canViewAs` locally — `AccessStoreFacade` already documents that staff/superuser checks always resolve to the *real* identity regardless of any active facade, and the facade is purely frontend-side, never touching this backend call. Deriving `canViewAs = isStaff || isSuperUser` from the new endpoint is equivalent to today's behavior.
- **Error handling**: `checkStatus()` today silently swallows network/non-OK failures (no retry, no rethrow), leaving state at its logged-out default. The new endpoint's client integration must preserve this catch-and-ignore, non-throwing pattern — including for the derived `canViewAs`, which now depends on the same fetch.

### Still open

- Endpoint shape/location (new dedicated view/URL vs. extending an existing one) — naming and route TBD.
- Backend permission/serializer design for the new endpoint — needs security/data-access review as new attack surface (new endpoint = new authorization surface), per this project's security review guidelines.

## Benefits

- Fewer round-trips on every header render (route change, page load).
- Header gets a single internal source for its own `isStaff`/`isSuperUser` resolution instead of two independent call paths to the same backend truth (see Problem — this does not unify with `AccessStore.ensureStaffOrSuperUser()`, which stays a separate, shared gate used elsewhere).
