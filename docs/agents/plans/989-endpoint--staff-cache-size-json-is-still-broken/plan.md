# Plan: endpoint /staff/cache/size.json is still broken

Issue: [989-endpoint--staff-cache-size-json-is-still-broken.md](../issues/989-endpoint--staff-cache-size-json-is-still-broken.md)

## Overview

`CacheSizeHandler`'s success response builds its `headers` as an associative array (`['Content-Type' => 'application/json']`) instead of the list-of-`"Name: Value"`-strings shape Tent's `Response`/`index.php` actually expects. `index.php`'s `send_response()` does a bare `foreach ($response->headers() as $header) { header($header); }`, so with an associative array the key is silently dropped and PHP calls `header('application/json')` — a line with no `Name:` prefix, which Apache/CGI rejects with `Bad header: application/json`, producing a 500 for every caller including staff/superuser accounts that pass the auth check. This plan fixes the header shape at its one call site and closes the test gap that let it ship undetected.

## Context

- Confirmed live against the real backend that `/users/status.json` returns `200`/`is_staff: true` for an affected staff caller, isolating the bug to the success-response construction (not the auth check).
- `UploadHandler.php` (two call sites) and `DeleteHandler.php` already use the correct shape — `UploadHandler.php` literally (`['Content-Type: application/json']`), `DeleteHandler.php` by forwarding `BackendClient`'s already-correctly-shaped `headers` array. `CacheSizeHandler.php` is the sole outlier.
- The bug has been present since the handler's first commit (#973/#974) and survived two later "fix" PRs (#979/#982, #984/#986) untouched — neither touched this line.
- `CacheSizeHandlerTest::testStaffUserGetsCacheSize` currently asserts only `httpCode()` and `body()`, never `headers()` — exactly why the wrong shape shipped undetected.

## Implementation Steps

### Step 1 — Fix the header shape in `CacheSizeHandler`

In `proxy/extension/lib/handlers/CacheSizeHandler.php`, in `processsRequest()`'s success-path `Response` construction, change:

```php
'headers'  => ['Content-Type' => 'application/json'],
```

to:

```php
'headers'  => ['Content-Type: application/json'],
```

No other line in that method needs to change.

### Step 2 — Add the missing regression assertion

In `proxy/extension/tests/handlers/CacheSizeHandlerTest.php`, in `testStaffUserGetsCacheSize()`, add an assertion on the response headers right after the existing `httpCode()`/`body()` assertions:

```php
$this->assertSame(['Content-Type: application/json'], $response->headers());
```

This mirrors the pattern `UploadHandlerTest.php` already uses for its own success-path assertions (e.g. `assertContains('Content-Type: application/json', $response->headers())`), and would have caught this exact bug had it existed before.

### Step 3 — Run the proxy test suite

Run the full `proxy/extension/tests` suite (see CI Checks below) to confirm the fix and new assertion pass, and that no other test in the file regresses.

## Files to Change

- `proxy/extension/lib/handlers/CacheSizeHandler.php` — fix the `headers` shape on the success `Response`.
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — add a `headers()` assertion to `testStaffUserGetsCacheSize()`.

## CI Checks

- `proxy/extension`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` run inside the `darthjee/tent-test:0.10.0` image (CI job: `proxy_extension_tests`) — e.g. `docker run --rm -v $(pwd)/proxy/extension:/var/www/html/extension darthjee/tent-test:0.10.0 vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests`.

## Notes

- No other handler needs a change — `UploadHandler.php` and `DeleteHandler.php` were checked and already use the correct header shape.
- No auth/staff-check logic changes; this is purely a response-header shape fix, so no security or data-access review is warranted beyond normal code review.
