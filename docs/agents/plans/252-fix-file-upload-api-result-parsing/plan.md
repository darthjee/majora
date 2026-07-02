# Plan: Fix file upload API result parsing

Issue: [252-fix-file-upload-api-result-parsing.md](../issues/252-fix-file-upload-api-result-parsing.md)

## Overview

`PhotoUploadHandler::updateStatus()` forwards the client's `Accept-Encoding`
header verbatim to the backend on both internal status-update PATCH calls
(`uploading` and `uploaded`). If the backend (or an intermediary in front of
it) honors that header and returns a gzip-compressed body, `json_decode()` in
`requestUploadingStatus()` silently fails (returns `null`) because the
`Tent\Http\CurlHttpClient` never decompresses the response. This makes
`file_path` resolve to `null` and trips a spurious `BackendErrorException(500)`
even though the backend call succeeded. The fix removes `Accept-Encoding` from
the header allow-list used for these two internal calls so the backend always
returns an uncompressed body.

## Context

Since #246, `PhotoUploadHandler::ALLOWED_FORWARD_HEADERS` includes
`Accept-Encoding`. These two PATCH calls are internal to the proxy — their
JSON responses are parsed and consumed entirely within `PhotoUploadHandler`
and never re-sent to the browser — so there is no reason to let the backend
compress them.

## Implementation Steps

### Step 1 — Stop forwarding `Accept-Encoding` to the backend

In `proxy/extension/lib/PhotoUploadHandler.php`, remove `'Accept-Encoding'`
from the `ALLOWED_FORWARD_HEADERS` const (used by `filterHeaders()`, called
from `updateStatus()` for both the `uploading` and `uploaded` PATCH calls).
This guarantees the backend never receives a gzip-eligible `Accept-Encoding`
header on these internal calls, so its JSON response body is always
uncompressed and safely parseable by `json_decode()`.

Update the doc comment on `ALLOWED_FORWARD_HEADERS` (currently lists
`Accept-Encoding` implicitly via the array) if it references the header
explicitly elsewhere.

### Step 2 — Update the existing test

In `proxy/extension/tests/PhotoUploadHandlerTest.php`,
`testOnlyAllowListedHeadersAreForwardedToBackend()` currently sends
`Accept-Encoding: gzip` in the incoming request and asserts it is present
verbatim in `$expectedHeaders` passed to the backend. Update this test so
`Accept-Encoding` is treated like the other now-dropped header
(`X-Trace-Id`): still present on the incoming request, but absent from
`$expectedHeaders`. Also check
`testAllowListedHeadersAreMatchedCaseInsensitively()` and any other test in
the same file that references `Accept-Encoding`, and update them
consistently so no test still asserts `Accept-Encoding` is forwarded.

## Files to Change
- `proxy/extension/lib/PhotoUploadHandler.php` — remove `Accept-Encoding` from `ALLOWED_FORWARD_HEADERS`.
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — update assertions so `Accept-Encoding` is no longer expected in the headers forwarded to the backend.

## CI Checks
- `proxy`: `docker-compose run proxy_tests` (runs `vendor/bin/phpunit extension/tests`; no dedicated CircleCI job currently exercises this — verify locally before opening the PR)

## Notes
- Only the `proxy` agent has work for this issue; no backend, frontend, or infra changes are needed.
- `Accept-Encoding` remains irrelevant to the final response sent back to the browser: `processsRequest()` builds that response itself with a fresh `Content-Type: application/json` header, independent of what the backend returned.
