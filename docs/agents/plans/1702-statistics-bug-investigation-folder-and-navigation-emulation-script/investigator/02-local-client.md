# Local client: safety, secrets, token and export reader

Build the pieces of `emulate.py` every scenario uses.

- **Base URL guard:** proxy and backend base URLs come from arguments or environment, with
  local defaults. Refuse to start unless every host is on an allowlist (`localhost`,
  `127.0.0.1`, the compose service names). No override flag.
- **Secrets:** read `PROXY_SECRET` and `STATISTICS_SKIP_SECRET` from the environment; never
  print, log or write them. Fail clearly if one a scenario needs is missing.
- **Browser:** a per-scenario cookie jar plus a request helper that records, for each response,
  its arrival time and applies its `Set-Cookie` in **arrival order** (so parallel bursts behave
  like a browser, including an older response overwriting a newer cookie).
- **Token (device authorization, #1708):**
  - create an authorization request with `scopes: ["statistics:read"]` (see
    `docs/agents/specs/statistics-bug/export-endpoint.md#device-authorization` and the views in
    `backend/accounts/views/authorization_requests/` for the exact routes and payloads);
  - print the local approval link, poll until approved, keep the `mjr_` token in memory only;
  - denied or expired → exit non-zero with a clear message and no report.
- **Export reader:** page sequentially through `GET /staff/statistics/export.json` with the
  token, for a day range covering the scenario window, then filter sessions by `created_at`
  inside the window (timestamps are whole seconds: widen the window by one second on each side
  and document it).
- **Self-pollution:** every request the script makes for itself (authorization create/poll,
  export) sends `X-Statistics-Skip-Secret`. After authorizing, check that no session was
  created by these requests (e.g. export the window around the authorization and expect none)
  and report the result.

## Files to Change

- `investigations/statistics-bug/emulate.py` — guard, secrets, browser, token, export reader.
