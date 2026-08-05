# Plan: Request Staff Cache Size Json Failing With 403

Issue: [979-request-staff-cache-size-json-failing-with-403.md](../../issues/979-request-staff-cache-size-json-failing-with-403.md)

## Overview
`GET /staff/cache/size.json` 403s for staff/superuser users because `CacheSizeHandler` forwards the client's original `Host` header unchanged into its backend `/users/status.json` call, instead of rewriting it to the backend's own hostname the way its sibling handlers do. This plan adds the missing `Host`-header rewrite and matching test coverage. Only `proxy/` is touched, so this is a single-agent (`proxy`) plan.

## Context
`ForwardedHeaderFilter::BASE_ALLOWED_FORWARD_HEADERS` allow-lists `Host` alongside `Cookie`/`Authorization`, so it's forwarded as-is unless a handler explicitly overrides it. `DeleteHandler` and `UploadHandler` both do this in their constructors:

```php
$this->addMiddleware(new RenameHeaderMiddleware('Host', 'X-Forwarded-Host'));
$this->addMiddleware(new SetHeadersMiddleware(['Host' => $this->backendHost()]));
```

`CacheSizeHandler`'s constructor never does this, so the browser-facing `Host` (e.g. `majora.example.com`) reaches the backend's `GET .../users/status.json` call unchanged instead of being rewritten to the backend's own hostname (e.g. `backend:8080`), which is the likely cause of the 403 (see `docs/agents/external/tent/host-header.md`).

## Implementation Steps

### Step 1 — Add the Host-header rewrite middleware to `CacheSizeHandler`
In `proxy/extension/lib/handlers/CacheSizeHandler.php`, mirror `DeleteHandler`'s constructor pattern:
- Import `Tent\Middlewares\RenameHeaderMiddleware` and `Tent\Middlewares\SetHeadersMiddleware`.
- In the constructor, after assigning `$this->host`, add:
  ```php
  $this->addMiddleware(new RenameHeaderMiddleware('Host', 'X-Forwarded-Host'));
  $this->addMiddleware(new SetHeadersMiddleware(['Host' => $this->backendHost()]));
  ```
- Add a private `backendHost(): string` helper identical to `DeleteHandler`'s (`parse_url($this->host, PHP_URL_HOST) ?? $this->host`).

### Step 2 — Add test coverage
In `proxy/extension/tests/handlers/CacheSizeHandlerTest.php`, add a test mirroring `DeleteHandlerTest`'s Host-override assertion (see `DeleteHandlerTest.php:244`): assert that, regardless of the incoming request's `Host` header, the handler's backend call ends up with `Host` set to the backend's own hostname and the original preserved under `X-Forwarded-Host`. Follow the existing mock-`HttpClientInterface` + `$this->anything()`/explicit-headers-argument pattern already used in this test file, adapted to how `DeleteHandlerTest` verifies the header override (inspect its exact assertion mechanism and match it, since middleware application happens at the `RequestHandler::handleRequest()` level, not inside `processsRequest()` itself).

## Files to Change
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — add the `RenameHeaderMiddleware`/`SetHeadersMiddleware` pair and `backendHost()` helper.
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — add a test asserting the `Host` header is rewritten before the backend call.

## CI Checks
- `proxy/extension`: `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests` (CI job: `proxy_extension_tests`; locally via the `proxy_tests` docker-compose service)

## Notes
- The root cause is a plausible, well-evidenced hypothesis based on the established `Host`-rewrite convention in `DeleteHandler`/`UploadHandler`, not a confirmed live repro — if applying this fix doesn't resolve the 403 in practice, revisit whether `/users/status.json` itself (backend-side `ALLOWED_HOSTS`/session handling) needs a look.
- Out of scope (per the issue): `/staff/cache/size.json` is also missing from the frontend's skip-cache config (`skipCacheEndpoints.js`/`skipCacheSuffixes.js`); that's unrelated to this 403 and left for a separate issue.
