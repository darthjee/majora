# Plan: Consolidate Header's data-fetching into a single dedicated endpoint

Issue: [1188-consolidate-header-s-data-fetching-into-a-single-dedicated-endpoint.md](../../issues/1188-consolidate-header-s-data-fetching-into-a-single-dedicated-endpoint.md)

## Overview

Add one new, identity-resolved, `AllowAny` backend endpoint (`GET /users/header_status.json`) that returns Header's route-independent identity fields in a single response, reusing `/users/status.json`'s existing resolution logic rather than duplicating it. Swap `HeaderController#checkStatus` to call it instead of `AuthClient#status`, and retire `HeaderViewAsController`'s separate `canViewAs` fetch in favor of a local `isSuperUser || isStaff` derivation. `gameAccess` (`/games/<slug>/access.json`), `facadeEnabled` (local-only), and `AccessStore.ensureStaffOrSuperUser()` (a shared gate used by ~13 other call sites) are explicitly untouched. Ships as a single PR.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**Endpoint**: `GET /users/header_status.json` (proposed name — matches the existing `/users/status.json`/`/users/login.json`/`/users/register.json` sibling convention in `backend/accounts/urls/auth.py`; adjust if the backend agent finds a stronger fit, but keep frontend/backend in sync if renamed).

**Access**: `AllowAny`, unauthenticated included (same as `/users/status.json`). Always `HTTP 200`, never `401`/`403`.

**Backend response header**: `X-Skip-Cache: true`, set unconditionally by the view — this is mandatory (identity-dependent response; see the issue's Security & performance section for why a miss here is a cross-user data leak, not a style nit).

**Response body** (JSON, snake_case, mirrors `status.py`'s existing `_build_payload`/`_build_logged_in_payload` shape so the backend can reuse rather than reimplement the resolution logic):

| Field | Type | Present when |
|---|---|---|
| `logged_in` | `bool` | always |
| `status` | `"pending"` | only when the profile is `pending` — mutually exclusive with the fields below |
| `is_superuser` | `bool` | only in the full logged-in branch (approved, non-pending, non-denied) |
| `is_staff` | `bool` | only in the full logged-in branch |
| `cache_token` | `str` | only in the full logged-in branch; unconditionally re-minted (`get_or_create`) on every call, exactly like `/users/status.json` today |

Anonymous/denied → `{"logged_in": false}` only. Pending → `{"logged_in": false, "status": "pending"}` only (no `is_staff`/`is_superuser`/`cache_token`).

**What the frontend must do with the response**, exactly preserving today's behavior (see issue's Edge cases section):

- Map `logged_in`/`is_superuser`/`is_staff` → `setLoggedIn`/`setIsSuperUser`/`setIsStaff`.
- Map `status === 'pending'` → `setPendingApproval` (same derivation `HeaderController` already does).
- Map `cache_token` → `AuthStorage.setCacheToken(...)` — **required**, not optional (see below).
- Continue emitting `AuthEvents` after the fetch resolves, exactly as `checkStatus()` does today, so `recheckAuthState` and other `AuthEvents` subscribers (`RequestStore`, `AppController`, etc.) keep working.
- Derive `canViewAs = isSuperUser || isStaff` locally — no separate fetch.
- Catch-and-ignore network/non-OK failures, no retry/rethrow (same as `checkStatus()` today).

**Why `cache_token` is a hard requirement, not a nice-to-have**: `HeaderController#checkStatus` is today's routine bootstrap path that hydrates `AuthStorage`'s `cache_token` for any already-logged-in session that just loads/refreshes a page (not only fresh logins). `BaseClient` attaches `X-Cache-Token` on every request once known; the Tent proxy's `PrivateRequestHasher` buckets every header-less caller into one **shared** cache slot on 3 restricted routes (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`) — documented as unsafe for responses that vary per caller. Dropping `cache_token` from the new endpoint would silently regress those 3 routes into cross-user cache-sharing risk for the common "already logged in, reload the page" case.

**Reachability**: no proxy rule changes needed — confirmed the Tent proxy's `backend.php` has a generic catch-all forwarding any `*.json` path to Django (`proxy/dev_configuration/rules/backend.php`, mirrored in `prod_configuration`); per-route proxy rules only exist for special caching semantics, not basic routing.

## Notes

- Endpoint route/naming is a judgment call made during planning (the issue left it explicitly open) — `/users/header_status.json` is the proposed default; if the backend agent picks a different path, the frontend plan and the shared-contracts table above must be updated to match before implementation.
- `docs/agents/access-control/endpoints.md` must be updated with the new endpoint's row in the same PR (see backend plan) — an explicit repo convention for new endpoints, and this endpoint's row should note it deliberately mirrors `/users/status.json`'s access rules rather than introducing new ones.
- Security/data-access review of this new endpoint's authorization surface is expected as part of normal PR review (the `security`/`data-access` agents are read-only reviewers, not implementers, so they have no file of their own in this plan).
