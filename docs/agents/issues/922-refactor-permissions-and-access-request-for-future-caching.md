# Issue: Refactor permissions and access request for future caching

## Description
The app currently uses two endpoints to decide which pages/UI components a user has access to:

- `GET .../access.json`
- `GET .../permissions.json`

### Regular flow
A client requests `access.json`, then requests `permissions.json` with no `role` params. Because `permissions.json` receives no roles, the backend checks the actual roles the logged-in user belongs to.

### Mocked flow
A staff/DM/admin user can simulate a different role by requesting `permissions.json?role=player&role=owner` (etc). In this case the backend uses the roles given in the query string instead of the real user's roles.

### Known clients
At least these frontend clients call these endpoints (there may be others, to be located during implementation):
- `frontend/assets/js/client/GameClient.js`
- `frontend/assets/js/client/TreasureClient.js`
- `frontend/assets/js/client/CharacterClient.js`

## Problem
`GET .../permissions.json` behaves differently depending on whether roles are passed:
- When a set of roles is sent, the response is always the same for that set of roles — this could safely be cached.
- When no roles are sent, the response depends on the requesting user (their real roles), so it cannot be cached as-is.

This inconsistency blocks introducing a cache for `permissions.json`, since today the same URL shape (no roles) can mean different things for different users.

## Expected Behavior
- `GET .../permissions.json` should always be called with an explicit set of roles (including a `logged` role when relevant), except when explicitly using the mock-roles "Not Logged" feature.
- `GET .../access.json` should return an `is_logged` flag reflecting whether the current user is logged in.
- The backend for `permissions.json` should treat a request with no roles as an empty role set (`[]`), i.e. an anonymous user with no special access. The real DB/session-based role resolution is removed entirely — `permissions.json` becomes a pure function of the roles passed in the query string (or their absence), never inspecting the actual session/user.
- When a request includes some roles but omits `logged`, `logged` defaults to `False` (same treatment as any other unspecified role) — there is no implicit "assume logged in" fallback.
- The "simulate a different role" mock modal should gain a new "Not Logged" toggle, so testers can simulate the anonymous/no-roles case explicitly.

## Solution
### Frontend
- **Always request passing the roles.** Once the response for `GET .../access.json` is available, request `GET .../permissions.json` using the roles from that response — unless the mock-roles feature is active.
- **Include `logged` in the list of roles.** `GET .../access.json` will return `is_logged`, which is added to the roles list sent to `permissions.json`.
- **Add "Not Logged" to the mock roles modal.** A new toggle, "Not Logged", is added above "Game Master".
  - By default, when mocking roles, the permissions request includes the `logged` role.
  - When "Not Logged" is engaged, "Game Master", "Player", and "Character owner" are hidden — the same behavior as when "Simulate a different role" is disabled.
  - "Not Logged" is still nested under "Simulate a different role": when that parent toggle is off, "Not Logged" is hidden along with the rest.
  - When "Not Logged" is on, the permissions request is sent without any role.

### Backend
- **Treat a missing role set as an empty set for `permissions.json`.** When `GET .../permissions.json` receives no roles, treat it as `[]` (anonymous, no special access), rather than inspecting the actual user.
- **Remove the real DB/session-based role resolution path.** `permissions.json` currently falls back to resolving the caller's actual roles from the DB/session when no `role` param is present at all. That fallback is removed as part of this issue: `parse_role_booleans`/`_simulated_roles` are simplified so "no role param" always yields an empty booleans dict (equivalent to all-`False`), and the `Roles(user=..., game=..., pc=...)` real-lookup constructor and its `_resolve_*` methods are deleted. `permissions.json` becomes a pure function of its query-string roles.
- **Add an explicit `logged` role.** `parse_role_booleans` recognizes a `logged` key alongside the existing `superuser`/`dm`/`owner`/`staff`/`player` keys, and `Roles.from_booleans` takes an explicit `is_logged_user` argument instead of hardcoding `True`. If a request includes some roles but omits `logged`, it defaults to `False` — same as any other unspecified role, with no implicit "assume logged in".
- **Add `is_logged` to `access.json`.** Since both an anonymous user and a logged-in user with no special roles (not player/dm/staff/owner) would now send `permissions.json` with no roles, and the backend must not distinguish them by checking the session (or it couldn't be cached), `access.json` gains an `is_logged` flag. The frontend adds this to the roles list sent to `permissions.json`.

### Out of scope
- Adding a cache on `GET .../access.json` — that response is still user-specific.
- Changing how other endpoints check permissions — non-`permissions.json` endpoints keep relying on the actual user's permissions.
- Actually implementing the cache on `permissions.json` — this issue only makes the endpoint cacheable; caching itself is a follow-up, done after validating this refactor works.
- Changes to what permissions/roles exist or mean.

## Benefits
Makes `GET .../permissions.json` a pure function of its input roles, removing the need to special-case "no roles" against the current user. This is a prerequisite for safely caching `permissions.json` responses in the future, without changing any actual permission semantics today.
