# Export Endpoint & `statistics:read` Scope

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

*Planned by #1699 (backend) and #1700 (frontend).* Nothing on this page exists yet. It is the
contract those sub-issues implement and test; if they have to deviate, they update this page
in the same PR.

## Scope

- **Family `statistics`, action `read` only.** Not `sessions`, which means game sessions. There
  is no `statistics:write`. `backend/accounts/scopes.py` needs per-family actions (or an
  equivalent) to offer `read` only.
- **Staff-only:** the owner must be admin or staff (`AdminOrStaffCache.is_admin_or_staff`).
- **Granting:** token creation and the device-authorization approval reject `statistics:read`
  for non-staff users with an explicit error. The scope is never silently stripped.
- **Per-game restrictions** on a token have no effect on this scope.
- The permanent scope docs (`docs/agents/access-control/token-scopes.md`) are updated by #1699.

## Access matrix

The single reference for #1699's tests and the reviews. Status codes follow what exists today:
`require_staff` (`backend/games/views/common.py`) returns `401` when unauthenticated and `403`
`not_allowed` when not admin/staff; scoped-token refusals (`backend/accounts/authentication.py`)
return `401` `token_invalid` for a bad token and `403` (the `ApiTokenForbidden` family, e.g.
`token_not_allowed`, missing scope) otherwise. "Staff" means admin or staff.

| Caller | Export endpoint | Other staff statistics endpoints | `DELETE staff/statistics.json` (clear) |
|---|---|---|---|
| Anonymous | 401 | 401 | 401 |
| Invalid / revoked token | 401 `token_invalid` | 401 | 401 |
| Logged-in non-staff (browser) | 403 `not_allowed` | 403 | 403 |
| Staff (browser) | allowed | allowed (unchanged) | allowed (unchanged) |
| Token without `statistics:read` | 403 (missing scope) | 403 `token_not_allowed` | 403 `token_not_allowed` |
| Token with `statistics:read`, non-staff owner | cannot exist (rejected at creation/approval); 403 `not_allowed` if it ever does | 403 | 403 |
| Token with `statistics:read`, staff owner | allowed | 403 `token_not_allowed` | 403 `token_not_allowed` |

Every other staff endpoint (cache, copy, crawler, photo) also stays `403` `token_not_allowed`
for any token, with or without the scope.

## Endpoint contract

- **Route:** a `GET` under `staff/statistics/…`; the exact route is chosen by #1699.
- **Params:**
  - date range (`from` / `to`), bounded by `MAJORA_STATISTICS_MAX_RANGE_DAYS`;
  - optional `domain`;
  - `page` / `per_page`, with a maximum page size (paginated with the headers of
    [pagination.md](../../pagination.md)).
- **Ordering** on indexed columns.
- **Payload:** sessions with `id`, `ip`, `domain`, `user_id`, `created_at`, `last_seen_at`,
  each with its visits (`started_at`, `last_seen_at`, `hits`). Visits are fetched in batches
  (no N+1).
- **Never exposed:** the session `token`, and no user e-mail, name or profile data.
- Params are validated before any query, like the other
  [statistics endpoints](../../statistics.md#api-conventions).

## Caching and tracking

- The response carries `X-Skip-Cache`.
- The route is listed in [no-private-cache-routes.md](../../no-private-cache-routes.md).
- It is not warmed by Navi.
- Its own requests create no statistics sessions or visits.

## Device authorization

The `analyse.py` script (see [Scripts](scripts.md)) gets its token through the existing
device-authorization flow: it creates and polls `users/authorization_requests.json`, and a staff
user approves it at `account/authorization_requests/<uuid>/authorize.json`.

## Frontend (#1700)

- The scope is offered only to staff. Visibility is resolved through `RequestStore` /
  `RequestPermissionResolvers`, not a direct `AccessStore` call.
- The approval screen labels it as access to visitor statistics (IP addresses and visit
  history).
- Translations exist for every language.

## Reviews

The `data-access` and `security` agents review the specs PR (#1697) and #1699, checking this
contract against [access-control](../../access-control.md) and
[security-guidelines](../../security-guidelines.md).
