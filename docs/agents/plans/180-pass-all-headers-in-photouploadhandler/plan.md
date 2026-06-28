# Plan: Pass all headers in PhotoUploadHandler

Issue: [180-pass-all-headers-in-photouploadhandler.md](../issues/180-pass-all-headers-in-photouploadhandler.md)

## Overview

Replace the manual header cherry-picking in `PhotoUploadHandler::processsRequest` with a forwarding of all incoming request headers, overriding only `Content-Type` to `application/json`. Update the test suite to assert that extra headers are forwarded.

## Context

`PhotoUploadHandler` currently extracts only `Authorization` and `X-Upload-Token` from the incoming request and passes those two to the backend PATCH calls. Any other headers (custom trace headers, session tokens, future auth schemes) are silently dropped. The sibling `ProxyRequestHandler` already uses `$request->headers()` wholesale, overriding only `Content-Type` when needed — this issue brings `PhotoUploadHandler` in line with that pattern.

## Implementation Steps

### Step 1 — Replace cherry-picked headers with full header forwarding

In `proxy/extension/PhotoUploadHandler.php`, inside `processsRequest`, remove the three lines that extract `Authorization` and `X-Upload-Token` individually and build `$backendHeaders` from them. Replace the entire block with:

```php
$backendHeaders = array_merge(
    $request->headers(),
    ['Content-Type' => 'application/json']
);
```

Both PATCH calls already use `$backendHeaders`, so no further changes are needed in the method body.

### Step 2 — Add a test asserting all headers are forwarded

In `proxy/extension/tests/PhotoUploadHandlerTest.php`, add a test that passes extra headers beyond `Authorization` and `X-Upload-Token` in the request and asserts those extra headers are included in the backend calls. Use a `withConsecutive`-style matcher or `callback` constraint on the mock to inspect the headers argument of each `request()` call.

## Files to Change

- `proxy/extension/PhotoUploadHandler.php` — replace the cherry-picking block with `array_merge($request->headers(), ['Content-Type' => 'application/json'])`
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — add a test verifying that extra request headers reach the backend PATCH calls

## CI Checks

- `proxy/extension`: `docker-compose run proxy_tests` (CI job: `proxy_tests` service via docker-compose)

## Notes

- The `Content-Type` override is essential because both PATCH calls send a JSON body, regardless of what `Content-Type` the original multipart upload request had.
- `array_merge` is correct here: keys from the second array win, so `Content-Type` from the explicit override will always supersede whatever the client sent.
- The existing test `testValidImageUploadReturnsTwoHundred` does not assert on the headers argument of the mock; only the new test needs to do so.
