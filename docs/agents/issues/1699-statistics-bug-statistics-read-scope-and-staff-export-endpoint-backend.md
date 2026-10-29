# Issue: Statistics bug: statistics:read scope and staff export endpoint (backend)

## Description

Part of Epic #1696 (statistics session investigation). The investigation script needs to read
raw production statistics data. Scoped API tokens cannot reach any staff endpoint today, and no
endpoint exposes raw session rows. This issue adds a read-only `statistics:read` scope and a staff
export endpoint. It implements the contract in
`docs/agents/specs/statistics-bug/export-endpoint.md`, including its access matrix. If the
implementation has to deviate, it updates that page in the same PR.

## Problem

- `backend/accounts/scopes.py` generates `family × (read, write)` for every family, so it cannot
  offer a read-only family.
- `EXCLUDED_ROUTE_PREFIXES` includes `staff/`, so every scoped token is refused with
  `token_not_allowed` on every staff route.
- No endpoint returns raw statistics sessions and visits.
- `StatisticsSessionMiddleware` would track the export requests themselves and pollute the data
  being investigated.

## Expected Behavior

A staff user, or a scoped token with `statistics:read` whose owner is still staff, can page
through raw statistics sessions and their visits for a bounded date range. Every other staff
route, including the other statistics routes and the `DELETE staff/statistics.json` clear, keeps
refusing every scoped token. The export requests create no statistics sessions or visits.

## Solution

### Scope

- Add the `statistics` family with the **read action only** (no `statistics:write`). The
  catalogue gets per-family actions, or an equivalent. The family is named `statistics`, not
  `sessions`, which already means game sessions.
- **Staff only:** the export view calls `require_staff` on the token's user on **every request**.
  A demoted owner keeps the scope on the token but gets `403` `not_allowed`.
- `GET /account/api_tokens/options.json` lists `statistics:read` only for admin/staff callers.
- `POST /account/api_tokens.json` rejects `statistics:read` for non-staff users with `400`
  `scope_staff_only`. The scope is never silently stripped.
- Per-game restrictions on a token have no effect on this scope.
- **Carve-out:** an exact-route allow-list for the export route only, never a prefix.

### Endpoint

- `GET staff/statistics/export.json`, declared with `@token_scopes` (`statistics:read` for `GET`).
- Params: `from` / `to`, bounded by `MAJORA_STATISTICS_MAX_RANGE_DAYS` (`from > to` is a `400`).
  Optional `domain` (an existing `Domain` id or `unknown`). `page` / `per_page` with the
  pagination headers; `per_page` defaults to `MAJORA_PAGINATION_SIZE` and a value above `100` is a
  `400`. Params are validated before any query.
- Ordering is fixed on the server: `created_at`, then `id`.
- Payload: sessions with `id`, `ip`, `domain`, `user_id`, `created_at`, `last_seen_at`, each with
  its visits (`started_at`, `last_seen_at`, `hits`).
  - Only visits whose `started_at` falls in the range are included.
  - The number of visits is capped at **100 per session**, with `visits_truncated: true` when the
    list was cut off.
  - Visits are fetched in batches (no N+1).
- Never exposed: the session `token`, user e-mail, name or profile data.

### Caching and tracking

- The response carries `X-Skip-Cache` and `Cache-Control: private, no-store`.
- The route is listed in `docs/agents/no-private-cache-routes.md`, matches no cached Tent rule (with
  a test), and is not warmed by Navi.
- `StatisticsSessionMiddleware` skips the export route through an exact-route exemption, recorded
  in `docs/agents/statistics.md`.

### Docs

- Update `token-scopes.md`, the token-scope coverage test, `api-token.md` and `endpoints.md`.

### Out of scope

- The device-authorization flow issuing scoped tokens: #1708.
- The frontend: #1700.
- Any change to the session-tracking logic itself.

### Testing

- Every row of the spec's access matrix, including a staff owner who is demoted later (the test
  invalidates `AdminOrStaffCache`).
- Other staff endpoints (cache, copy, crawler, photo, other statistics routes, clear) still refuse
  scoped tokens.
- `options.json` and token creation for staff and non-staff.
- Payload fields (no `token`), the visits range and cap, `visits_truncated`.
- Pagination, `per_page` cap, range bounds, `from > to`, `domain` filter.
- No statistics session or visit created by export requests.

### Responsible agents

`backend`; `cache` (review `X-Skip-Cache`/Navi); `data-access` and `security` (review).

## Benefits

The investigation can read production statistics with a token that is read-only, staff-bound and
limited to one route, without polluting the data it reads.
