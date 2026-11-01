# Authorized, read-only export reader

Get the token and read the requested range, sequentially and read-only.

## Client and device authorization

- **Client:** sends no cookie and only `GET` requests, except the single authorization
  `POST`.
  - Locally, it adds `X-Statistics-Skip-Secret` when the secret is present.
  - Against production, it never adds it.
  - It has a distinct `User-Agent`, for example `majora-statistics-bug-analyse/1.0`.
- **Device authorization:** same flow as `emulate.py`:
  1. `POST users/authorization_requests.json` with `scopes: ["statistics:read"]`;
  2. print the approval URL and the request's expiry;
  3. poll every 3 s with `X-Authorize-Token` and `X-Skip-Cache`.
- **Ending the wait:**
  - approved with an `mjr_` token → keep it in memory only;
  - 422 (expired) or 403 (denied or consumed) → `AuthorizationFailed`, no report.
- The token is never printed, logged, written, or included in a `repr`.

## Export reader

- Pages through `GET /staff/statistics/export.json` for `from` / `to` / `tz` (and `domain`
  if given):
  - `per_page=100`;
  - one request at a time;
  - follow the `pages` header.
- Print progress only as page numbers and row counts.
- Any non-200 response is `AuthorizationFailed`. This covers a 401 mid-run (token revoked or
  expired): stop cleanly, and write no partial report.
- Sort the sessions by `id`.

## Production self-tracking

- The authorization create and poll requests are tracked in production. Remove any session
  whose `first_path` is one of the script's own route patterns (`SELF_ROUTES`, same set as
  `emulate.py`) from the analysis.
- Report how many were removed as "self sessions (authorization side effect)".
- Locally with the skip secret, that number must be 0. Step 05 checks this.

## ID reset (#1684)

- Walk the sessions in `id` order. Wherever `created_at` goes **backwards** by more than the
  race window while `id` goes up (or `id` goes down while `created_at` goes up), record a
  reset point.
- Split the data into segments at those points, and analyse each segment separately.
- Each reset is a warning in the report, not a failure.

## Files to Change

- `investigations/statistics-bug/analyse.py`: `Client`, `DeviceAuthorization`, `ExportReader`,
  self-route filtering, reset detection and segmenting.
