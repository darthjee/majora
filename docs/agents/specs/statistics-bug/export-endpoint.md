# Export Endpoint & `statistics:read` Scope

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

*Planned by #1699 (backend), #1700 (frontend) and #1708 (device authorization).* The scope,
the access matrix, the endpoint and its caching and tracking rules are implemented by #1699;
the [Device authorization](#device-authorization) changes (#1708) and the
[Frontend](#frontend-1700) (#1700) are not yet. It is the contract those sub-issues implement
and test; if they have to deviate, they update this page in the same PR.

## Scope

- **Family `statistics`, action `read` only.** Not `sessions`, which means game sessions. There
  is no `statistics:write`. `backend/accounts/scopes.py` needs per-family actions (or an
  equivalent) to offer `read` only.
- **Staff-only:** the owner must be admin or staff (`AdminOrStaffCache.is_admin_or_staff`).
  The owner's status is re-checked on **every request**: the export view calls `require_staff`
  on the token's user, not only when the scope is granted. A staff owner demoted after the
  token was granted keeps the scope on the token (`effective_scopes` does not look at roles) but
  gets `403` `not_allowed`.
- **Granting:**
  - `GET /account/api_tokens/options.json` lists `statistics:read` only for admin/staff
    callers.
  - `POST /account/api_tokens.json` and the device-authorization approval (see
    [Device authorization](#device-authorization)) reject `statistics:read` for non-staff users
    with an explicit `400` validation error, `scope_staff_only`
    (`{"errors": {"scopes": ["scope_staff_only"]}}`). The scope is never silently stripped.
- **Per-game restrictions** on a token have no effect on this scope.
- **Declared on the view:** the export view declares `@token_scopes` with `statistics:read` for
  `GET` only, as the token-scope coverage test requires.
- **`staff/` exclusion carve-out:** `EXCLUDED_ROUTE_PREFIXES` includes `staff/`, which refuses
  every scoped token with `token_not_allowed` before any declaration is read
  ([token-scopes.md](../../access-control/token-scopes.md)). #1699 adds a carve-out for
  **exactly** the export route: an exact-route allow-list (`SCOPED_STAFF_ROUTES` in
  `backend/accounts/authentication.py`), never a prefix. Every other `staff/*`
  route, including the other statistics routes and the `DELETE` clear, keeps refusing every
  scoped token.
- The permanent docs ([token-scopes.md](../../access-control/token-scopes.md), the coverage
  test, [api-token.md](../../access-control/api-token.md) and
  [endpoints.md](../../access-control/endpoints.md)) are updated by #1699.

## Access matrix

The single reference for #1699's tests and the reviews. Status codes follow what exists today:
`require_staff` (`backend/games/views/common.py`) returns `401` when unauthenticated and `403`
`not_allowed` when not admin/staff; scoped-token refusals (`backend/accounts/authentication.py`)
return `401` `token_invalid` for an unusable token, `403` `scope_missing` for a missing scope and
`403` `token_not_allowed` for an excluded or undeclared route. "Staff" means admin or staff.

| Caller | Export endpoint | Other staff statistics endpoints | `DELETE staff/statistics.json` (clear) |
|---|---|---|---|
| Anonymous | 401 | 401 | 401 |
| Invalid, revoked or expired scoped token, or non-approved owner | 401 `token_invalid` | 401 `token_invalid` | 401 `token_invalid` |
| Logged-in non-staff (browser or legacy `Authorization: Token`) | 403 `not_allowed` | 403 `not_allowed` | 403 `not_allowed` |
| Staff (browser or legacy `Authorization: Token`) | allowed | allowed (unchanged) | allowed (unchanged) |
| Scoped token without `statistics:read` | 403 `scope_missing` | 403 `token_not_allowed` | 403 `token_not_allowed` |
| Scoped token with `statistics:read`, owner not staff (e.g. demoted after granting) | 403 `not_allowed` | 403 `token_not_allowed` | 403 `token_not_allowed` |
| Scoped token with `statistics:read`, staff owner | allowed | 403 `token_not_allowed` | 403 `token_not_allowed` |

Every other staff endpoint (cache, copy, crawler, photo) also stays `403` `token_not_allowed`
for any scoped token, with or without the scope. "Staff owner later demoted" is an explicit
test case; the test invalidates `AdminOrStaffCache` (it caches the staff flag by user id), so
the demotion takes effect as it does for every staff endpoint.

## Endpoint contract

- **Route:** `GET /staff/statistics/export.json` (`staff.views.staff_statistics_export`).
- **Params:**
  - date range (`from` / `to`, inclusive local days in `tz`, default `UTC`, as on the other
    statistics endpoints), bounded by `MAJORA_STATISTICS_MAX_RANGE_DAYS`. A session is in the
    range when its `created_at` is;
  - `from > to` is a `400`;
  - optional `domain`: an existing `Domain` id or `unknown`, like the other statistics
    endpoints, never a free-text filter;
  - `page` / `per_page`, paginated with the headers of [pagination.md](../../pagination.md).
    `per_page` defaults to `MAJORA_PAGINATION_SIZE` and is capped at `100`, like the other
    paginated statistics endpoints; a larger value is a `400`, not clamped.
- The shared parser also validates `user`, `audience` and `granularity`, which the export
  ignores.
- **Ordering:** fixed on the server on indexed columns (`created_at`, then `id`). It is not a
  client parameter.
- **Payload:** a plain array of sessions with `id`, `ip`, `domain` (`{"id", "domain"}`, or
  `{"id": "unknown", "domain": null}`), `user_id`, `created_at`, `last_seen_at` (ISO 8601 UTC,
  whole seconds), each with its `visits` (`started_at`, `last_seen_at`, `hits`) and
  `visits_truncated`. Visits are fetched in one windowed query per page (no N+1).
- **Tracking fields** (*added by #1713*): sessions gain `first_path`, `first_seen_logged` and
  `creation_reason`; visits gain `first_path` and `last_path`. They are `null` for rows created
  before the migration. Definitions: [Tracking columns](tracking-columns.md#columns).
- **Visits bound:** only the visits whose `started_at` falls in the requested range are
  included, earliest first, and the number per session is capped at **100**. A session whose
  visits were cut off says so in the payload (`visits_truncated: true`).
- **Never exposed:** the session `token`, and no user e-mail, name or profile data. The path
  fields hold route patterns, never a raw path, URL parameter or query string.
- Params are validated before any query, like the other
  [statistics endpoints](../../statistics.md#api-conventions).

## Caching and tracking

- The response carries `X-Skip-Cache`.
- The response carries `Cache-Control: private, no-store`: it holds IP addresses and user ids,
  so neither the browser nor an intermediary may keep it.
- The route is listed in [no-private-cache-routes.md](../../no-private-cache-routes.md) and
  matches no cached Tent rule; a test covers it, like the other staff routes.
- It is not warmed by Navi.
- **No self-tracking:** `StatisticsSessionMiddleware` skips the export route (an exact-route
  exemption added by #1699 and recorded in [Access Statistics](../../statistics.md)), so its
  own requests create no statistics sessions or visits. The script cannot use
  `X-Statistics-Skip-Secret` against production, since that secret never leaves the server.
  The few device-authorization requests (create, poll) stay tracked like any client; the
  `analyse.py` report notes this bounded side effect. Only their route pattern is stored in the
  [tracking columns](tracking-columns.md), never the request `uuid` (see
  [Path values](tracking-columns.md#path-values)).

## Device authorization

The `analyse.py` script (see [Scripts](scripts.md)) gets its token through the
device-authorization flow: it creates and polls `users/authorization_requests.json`, and a staff
user approves it at `account/authorization_requests/<uuid>/authorize.json`.

Today that flow issues a legacy DRF `Token` and a browser session (`_issue_login_credentials`
in `backend/accounts/views/authorization_requests/poll.py`), with full staff powers, including
the `DELETE` clear. That would defeat the read-only design, so #1708 extends it (#1699 only
adds the scope and the endpoint):

- an authorization request carries the requested scopes, validated at creation against the
  scope catalogue (known `family:action` values only, a bounded list, `400` otherwise), since
  the create endpoint is unauthenticated;
- the approval screen shows only catalogue labels for those scopes, never raw client text;
- the approval screen shows them, and approval rejects `statistics:read` for a non-staff
  approver (see [Scope](#scope));
- polling an approved request that asked for scopes issues an `mjr_` scoped `ApiToken` with
  exactly those scopes, never a legacy `Token` or a session;
- requests without scopes keep today's behaviour.

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
