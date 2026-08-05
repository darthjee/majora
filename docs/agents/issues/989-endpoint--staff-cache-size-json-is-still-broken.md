# Issue: endpoint /staff/cache/size.json is still broken

## Description

`/staff/cache/size.json` (`proxy/extension/lib/handlers/CacheSizeHandler.php`) returns a 500 for every caller, including staff/superuser accounts that pass the backend's staff check, because the proxy's own success response is malformed at the HTTP-header level.

## Problem

The endpoint is still broken, logging:

```
[Wed Aug 05 11:12:47 2026] [<server>] [error] [client 187.112.208.105:60717] [pid 452988] util_script.c(632): malformed header from script 'index.php': Bad header: application/json
```

Confirmed live: the backend's `/users/status.json` staff/superuser check succeeds (200, `is_staff: true`) for an affected caller, so the failure is isolated to the second phase — building and emitting the handler's own success response — not the auth check.

Root cause: `CacheSizeHandler.php`'s success response passes `'headers' => ['Content-Type' => 'application/json']` — an associative array. Tent's `Response` model expects `headers` as a plain list of full `"Name: Value"` strings (its own doc comment gives `['Content-Type: text/html']` as the example), because `index.php`'s `send_response()` does a bare `foreach ($response->headers() as $header) { header($header); }` — no key, so an associative array silently yields only the value. That's exactly why Apache logs `Bad header: application/json`: PHP ends up calling `header('application/json')`, a line with no `Name:` prefix, which CGI rejects.

This bug has been present since the handler's very first commit (#973/#974) and survived two later "fix" PRs (#979/#982, #984/#986) untouched — neither touched this line, both targeted the staff-access-check and backend-URL trailing-slash bugs instead.

## Expected Behavior

A logged-in staff or superuser caller receives `200` with `Content-Type: application/json` and a body of `{"size": <bytes>}` — no 500, no malformed-header log line.

## Solution

In `proxy/extension/lib/handlers/CacheSizeHandler.php`, change the success response's `headers` line to `'headers' => ['Content-Type: application/json']` (a list of `"Name: Value"` strings), matching the pattern `UploadHandler.php` already uses correctly in two places.

**Regression test:** `CacheSizeHandlerTest::testStaffUserGetsCacheSize` currently asserts only `httpCode()` and `body()` — it never checks `headers()`, which is exactly how the wrong shape shipped undetected. Add `$this->assertSame(['Content-Type: application/json'], $response->headers());` to that test, matching the pattern `UploadHandlerTest.php` already uses for its own success-path assertions.

**Scope:** confirmed the only call site using the wrong (associative) shape — `UploadHandler.php` (two call sites) and `DeleteHandler.php` already pass `headers` as a list of `"Name: Value"` strings correctly (the latter by forwarding `BackendClient`'s already-correctly-shaped `headers` array verbatim). No other handler needs a change.
