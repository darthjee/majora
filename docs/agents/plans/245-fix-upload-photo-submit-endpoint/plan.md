# Plan: Fix upload photo submit endpoint

Issue: [245-fix-upload-photo-submit-endpoint.md](../../issues/245-fix-upload-photo-submit-endpoint.md)

## Overview
`UploadBackendClient::updateStatus` forwards the browser's original `Host` header
(e.g. `moria.ffavs.net`) unchanged when calling the backend at a different host
(e.g. `https://moria-api.ffavs.net`). Cloudflare, sitting in front of the backend,
rejects the mismatched `Host` header with a 403 before the request ever reaches
the application. Fix this by overriding the outgoing `Host` header with the
backend's own host, derived from `$this->host`, mirroring what Tent's
`DefaultProxyRequestHandler` already does for every other backend-proxied route.

## Context
- `POST /uploads/:id/submit` is handled by `PhotoUploadHandler`, which calls
  `UploadBackendClient::updateStatus()` twice (status `uploading`, then
  `uploaded`) to advance the Upload state machine via `PATCH /uploads/:id.json`.
- `UploadBackendClient::updateStatus()` currently does `array_merge($headers, ['Content-Type' => 'application/json'])`
  — it only overrides `Content-Type`, so the original `Host` header from the
  browser-facing request passes straight through to the backend call, even
  though the actual target host (`$this->host`) is different.
- Every other proxied route uses Tent's stock `default_proxy` handler, which
  renames the incoming `Host` to `X-Forwarded-Host` and sets `Host` to the
  target host before forwarding. `PhotoUploadHandler`/`UploadBackendClient` is a
  bespoke handler that never applies this correction — this is the only route
  hitting the Cloudflare 403.
- This is a regression surface related to #243 (empty 200) and #244 (hardcoded
  backend host in `proxy/prod_configuration/rules/uploads.php`); this issue's
  403 has been reproducible since #244 was deployed.

## Implementation Steps

### Step 1 — Override the Host header in `UploadBackendClient::updateStatus`
In `proxy/extension/lib/UploadBackendClient.php`, derive the backend's own host
from `$this->host` (stripping scheme and any trailing path/slash, e.g. via
`parse_url($this->host, PHP_URL_HOST)`), and merge it into `$backendHeaders` as
`Host`, alongside the existing `Content-Type` override, so the outgoing header
merge overrides whatever `Host` the caller passed in. Add a small private
helper (e.g. `backendHost(): string`) to keep `updateStatus()` readable and to
make the derivation independently testable/reusable if `UploadBackendClient`
grows more calls in the future.

### Step 2 — Update/extend unit tests
In `proxy/extension/tests/UploadBackendClientTest.php`, update
`testUpdateStatusSendsPatchWithStatusBody` (and/or add a new test) to assert
that the headers passed to `HttpClientInterface::request()` include
`Host => <host derived from the backend URL>` — using a backend host constructed
the same way `PhotoUploadHandler` builds `UploadBackendClient` in production
(a full URL, e.g. `https://moria-api.ffavs.net`) — regardless of any `Host`
header present (or absent) in the headers passed into `updateStatus()`. Cover:
- No `Host` header in the input — the derived one is still added.
- A `Host` header already present in the input (e.g. the browser's original
  `moria.ffavs.net`) — it gets overridden by the derived backend host.

## Files to Change
- `proxy/extension/lib/UploadBackendClient.php` — override the outgoing `Host`
  header with the backend's own host, derived from `$this->host`.
- `proxy/extension/tests/UploadBackendClientTest.php` — assert the `Host`
  header override.

## CI Checks
- `proxy/extension`: `docker-compose run --rm proxy_tests` (no dedicated CircleCI
  job currently runs PHPUnit for `proxy/extension`; this is the project's local
  dev-cycle command per `docker-compose.yml`'s `proxy_tests` service, run as a
  sanity check even though it isn't gated in `.circleci/config.yml`).

## Notes
- `PhotoUploadHandler.php` itself needs no changes — it already forwards
  `$request->headers()` unchanged to `UploadBackendClient::updateStatus()`;
  the fix belongs entirely inside `UploadBackendClient`, which is the single
  place all backend-bound Upload requests funnel through.
- Tent's `RenameHeaderMiddleware` + `SetHeadersMiddleware` (used by
  `DefaultProxyRequestHandler`) live in the vendored `darthjee/tent` package,
  not in this repository, so they can't be reused directly here — the fix
  reimplements the equivalent `Host` correction locally in
  `UploadBackendClient`.
