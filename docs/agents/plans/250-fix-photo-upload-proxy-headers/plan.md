# Plan: Fix photo upload proxy headers

Issue: [250-fix-photo-upload-proxy-headers.md](../issues/250-fix-photo-upload-proxy-headers.md)

## Overview

`PhotoUploadHandler::updateStatus()` currently forwards every header from the
original client request to the backend's `PATCH /uploads/:id.json` calls,
which leaks client-facing headers (e.g. `Authorization`, `X-Upload-Token`)
that the backend has no need for. This plan adds an inline, case-insensitive
allow-list filter that restricts the forwarded headers to a fixed, minimal
set before both backend calls.

## Context

`PhotoUploadHandler` (`proxy/extension/lib/PhotoUploadHandler.php`) handles
`POST /uploads/:id/submit`. It reads all headers via `$request->headers()`
and passes them, unfiltered, into `updateStatus()`, which is called twice
(once per state transition: `uploading`, then `uploaded`). `updateStatus()`
already overrides `Content-Type` to `application/json`; `Host` and
`X-Forwarded-Host` are handled separately via middlewares in the
constructor (`RenameHeaderMiddleware`, `SetHeadersMiddleware`) and are
already present in `$headers` by the time `updateStatus()` runs.

The allow-list (case-insensitive header name matching) must be:
- `Host`
- `X-Forwarded-Host`
- `Cookie`
- `X-Skip-Cache`
- `Referer`
- `Accept-Encoding`
- `Accept-Language`
- `Accept`
- `Content-Type`

Any other incoming header (e.g. `Authorization`, `X-Upload-Token`,
`X-Trace-Id`) must be dropped before the backend calls.

## Implementation Steps

### Step 1 — Add a private allow-list filter to `PhotoUploadHandler`

Add a private class constant (e.g. `ALLOWED_FORWARD_HEADERS`) listing the
allow-listed header names (canonical casing, e.g. `X-Forwarded-Host`), and a
private method (e.g. `filterHeaders(array $headers): array`) that:
- Iterates over `$headers` (an associative array of `name => value`, as
  returned by `$request->headers()`).
- Keeps only entries whose key matches one of the allow-list names,
  case-insensitively (e.g. via `strtolower()` comparison against a
  lower-cased allow-list, or `array_filter` with `ARRAY_FILTER_USE_KEY`).
- Returns the filtered associative array, preserving the original casing of
  the keys that pass the filter (no need to normalize casing on output).

### Step 2 — Apply the filter in `updateStatus()`

In `updateStatus()`, apply `filterHeaders()` to `$headers` before setting
`Content-Type` and issuing the request, so the `Content-Type` override
still lands in the final array regardless of whether the client sent that
header. Order of operations: filter first, then force
`$headers['Content-Type'] = 'application/json'` — this guarantees
`Content-Type` is always present and always `application/json`, and that it
isn't accidentally dropped by the filter if it were excluded from the
allow-list (it isn't, but this keeps the override authoritative either
way).

This is the only call site that reaches the backend (`requestUploadingStatus`
and `requestUploadedStatus` both delegate to `updateStatus()`), so a single
change point is sufficient — no other method needs updating.

### Step 3 — Update tests

- Update `testAllRequestHeadersAreForwardedToBackend` (or replace it) in
  `proxy/extension/tests/PhotoUploadHandlerTest.php` to reflect the new
  behavior: send a mix of allow-listed and non-allow-listed headers (e.g.
  `Authorization`, `X-Upload-Token`, `X-Trace-Id` alongside `Cookie`,
  `Referer`, `Accept`, etc.) and assert that only the allow-listed headers
  (plus the forced `Content-Type` and the middleware-set `Host`) are present
  in the headers array passed to `$httpClient->request()` on both calls —
  and that the non-allow-listed headers are absent.
- Add a case-insensitivity test: send headers with non-canonical casing
  (e.g. `cookie`, `REFERER`) and assert they are still forwarded.
- Keep the other existing tests passing as-is; they either send no headers
  or headers unrelated to this filter (e.g.
  `testValidImageUploadReturnsTwoHundred` uses no header assertions beyond
  response shape).

## Files to Change

- `proxy/extension/lib/PhotoUploadHandler.php` — add the allow-list constant
  and `filterHeaders()` method; apply the filter in `updateStatus()`.
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — update the
  all-headers-forwarded test to assert the allow-list behavior instead, and
  add a case-insensitivity test.

## Notes

- No CircleCI job currently runs the proxy PHPUnit suite
  (`docker-compose run proxy_tests` — see `docker-compose.yml`, service
  `proxy_tests`, command `vendor/bin/phpunit extension/tests`); this must
  still be run locally via `docker-compose run --rm proxy_tests` (or
  equivalent) to verify the change before opening the PR, per the `proxy`
  agent's own workflow.
- Keep the filter inline in `PhotoUploadHandler` per the issue's `Solution`
  section — do not introduce a new Tent middleware for this.
