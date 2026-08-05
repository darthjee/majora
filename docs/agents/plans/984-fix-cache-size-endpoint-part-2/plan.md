# Plan: Fix cache size endpoint part 2

Issue: [984-fix-cache-size-endpoint-part-2.md](../issues/984-fix-cache-size-endpoint-part-2.md)

## Overview

Extract a `BackendClient` support class that owns everything a proxy handler needs to call the Django backend — gzip negotiation/decoding, URL joining, forwarded-header allow-listing, and Host/`X-Forwarded-Host` remapping — and migrate `CacheSizeHandler`, `DeleteHandler`, and `UploadHandler` to use it instead of their own duplicated logic. This fixes the two concrete bugs (gzip decode failure on `/users/status.json`, double-slash backend URLs) at their single shared root cause.

## Context

All three handlers currently hand-roll backend HTTP calls: they wire `RenameHeaderMiddleware`/`SetHeadersMiddleware` identically in their constructors to rewrite `Host`/`X-Forwarded-Host`, call the static `ForwardedHeaderFilter::filter()` before every backend call, and build backend URLs via raw `$this->host . '/path'` concatenation. None of them can decode a gzipped backend response — `Tent\Http\CurlHttpExecutor\Base` (in the separate `darthjee/tent` framework repo, out of scope for this PR) never sets a decoding curl option — and a trailing slash on the configured `host` produces `//path` double slashes in every one of them. See the issue for full background and the settled design decisions (client location, `request()` signature, gzip approach, migration/test-compatibility notes).

## Implementation Steps

### Step 1 — Create `BackendClient`

Add `proxy/extension/lib/support/BackendClient.php`, namespace `Tent\RequestHandlers`, alongside `ForwardedHeaderFilter`/`SecurePhotoStorage`/`PathTraversalGuard`.

- Constructor: `__construct(string $host, ?HttpClientInterface $httpClient = null)`, defaulting `$httpClient` to `new CurlHttpClient()` — same pattern the handlers use today.
- `url(string $path): string` — `rtrim($this->host, '/') . '/' . ltrim($path, '/')`.
- `backendHost(): string` (private) — same `parse_url($this->host, PHP_URL_HOST) ?? $this->host` logic currently duplicated in all three handlers.
- `request(string $method, string $path, array $incomingHeaders, ?string $body = null, array $extraAllowedHeaders = [], array $overrideHeaders = []): array`:
  1. Build the URL via `url($path)`.
  2. Filter `$incomingHeaders` via `ForwardedHeaderFilter::filter($incomingHeaders, $extraAllowedHeaders)` — reuse the existing class internally rather than duplicating its allow-list, so there's still one literal list of allowed header names.
  3. Override `Host` to `backendHost()` and set `X-Forwarded-Host` from the original `$incomingHeaders['Host']` (case-insensitive lookup), replacing what `RenameHeaderMiddleware`/`SetHeadersMiddleware` did via the request-middleware pipeline.
  4. Apply `$overrideHeaders` last (e.g. `Content-Type` overrides).
  5. Add `Accept-Encoding: gzip` to the outgoing headers.
  6. Call `$this->httpClient->request($method, $url, $headers, $body)`.
  7. If the response's `headers` (array of `"Name: Value"` lines) contains `Content-Encoding: gzip` (use `Tent\Utils\CurlUtils::mapHeaderLines()` to parse), replace `$result['body']` with `gzdecode($result['body'])`.
  8. Return the `{body, httpCode, headers}` array unchanged in shape.

### Step 2 — Migrate `CacheSizeHandler`

- Constructor: keep the public signature (`string $host, ?HttpClientInterface $httpClient = null, string $cachePath = ''`); build `$this->client = new BackendClient($host, $httpClient)` instead of storing `$httpClient` directly. Drop the `RenameHeaderMiddleware`/`SetHeadersMiddleware` wiring — no longer needed.
- `requireStaffAccess()`: replace `$this->httpClient->request('GET', $this->statusUrl(), $headers)` with `$this->client->request('GET', '/users/status.json', $request->headers())` (pass the raw incoming headers directly; `BackendClient` does the allow-list filtering now, so drop the handler's own `ForwardedHeaderFilter::filter()` call).
- Remove `statusUrl()` and `backendHost()` (now owned by `BackendClient`).

### Step 3 — Migrate `DeleteHandler`

- Same constructor change as Step 2.
- `requestDeletablePath()` and the final `DELETE` call: replace `$this->httpClient->request(...)` with `$this->client->request(...)`, passing `$request->headers()` directly (raw, unfiltered) and paths via `deletableUrl()`/`deleteUrl()`'s existing path-building logic (unchanged — only the `$this->host . '...'` prefix concatenation goes away, since `BackendClient::request()` calls `url()` internally).
- Remove the constructor's middleware wiring, the handler's own `ForwardedHeaderFilter::filter()` call, and `backendHost()`.

### Step 4 — Migrate `UploadHandler`

- Same constructor change.
- `updateStatus()`: replace the direct `ForwardedHeaderFilter::filter($headers, self::EXTRA_ALLOWED_FORWARD_HEADERS)` + `$headers['Content-Type'] = 'application/json'` + `$this->httpClient->request('PATCH', ...)` with a single `$this->client->request('PATCH', '/uploads/' . $uploadType . '/' . $uploadId . '.json', $headers, json_encode(['status' => $status]), self::EXTRA_ALLOWED_FORWARD_HEADERS, ['Content-Type' => 'application/json'])`.
- Remove the constructor's middleware wiring and `backendHost()`. Keep `EXTRA_ALLOWED_FORWARD_HEADERS` as-is (now passed as `$extraAllowedHeaders`).

### Step 5 — Update existing handler tests

`CacheSizeHandlerTest.php`, `DeleteHandlerTest.php`, `UploadHandlerTest.php` all assert the exact headers/URL passed to the mocked `HttpClientInterface::request()`. Update those assertions to expect:
- `Accept-Encoding: gzip` present in the forwarded headers.
- The sanitized single-slash URL form (relevant if any test configures a `host` with a trailing slash, or add a case that does).
- `Host`/`X-Forwarded-Host` still correctly remapped (behavior unchanged, now computed by `BackendClient` instead of the middleware pipeline — construct handlers directly in tests, bypassing `RequestHandler::handleRequest()`'s middleware application, so this needs care: confirm whether existing tests call `handleRequest()` or `processsRequest()` directly, since removing the middleware wiring changes what a direct `processsRequest()` call sees for `Host`/`X-Forwarded-Host` on the *incoming* request — `BackendClient` now does this remap itself, so the test's incoming request headers should still just be the raw client-sent `Host`, not pre-rewritten).

### Step 6 — Add `BackendClientTest.php`

New `proxy/extension/tests/support/BackendClientTest.php` covering, against a mocked `HttpClientInterface`:
- `url()` join behavior (host with/without trailing slash, path with/without leading slash).
- `request()` filters headers down to the base allow-list + `$extraAllowedHeaders`.
- `request()` overrides `Host`/sets `X-Forwarded-Host` correctly.
- `request()` applies `$overrideHeaders` after filtering.
- `request()` adds `Accept-Encoding: gzip` to outgoing headers.
- `request()` decodes the body via `gzdecode()` when the mocked response includes `Content-Encoding: gzip`, and passes the body through unchanged when it doesn't.

## Files to Change

- `proxy/extension/lib/support/BackendClient.php` — new class (Step 1).
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — migrate to `BackendClient` (Step 2).
- `proxy/extension/lib/handlers/DeleteHandler.php` — migrate to `BackendClient` (Step 3).
- `proxy/extension/lib/handlers/UploadHandler.php` — migrate to `BackendClient` (Step 4).
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — update header/URL assertions (Step 5).
- `proxy/extension/tests/handlers/DeleteHandlerTest.php` — update header/URL assertions (Step 5).
- `proxy/extension/tests/handlers/UploadHandlerTest.php` — update header/URL assertions (Step 5).
- `proxy/extension/tests/support/BackendClientTest.php` — new tests (Step 6).

## CI Checks

- `proxy/`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests`)
- `proxy/`: `docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c 'find /repo/proxy -name "*.php" -print0 | xargs -0 -n1 php -l'` (PHP lint, no dedicated CI job but good practice before pushing)

## Notes

- `Tent\Http\HttpClientInterface`/`CurlHttpClient`/`RenameHeaderMiddleware`/`SetHeadersMiddleware`/`Tent\Utils\CurlUtils` all live in the separate `darthjee/tent` repo — read-only dependencies from `majora-2`'s point of view. Nothing in this plan requires changes there.
- `ForwardedHeaderFilter` is reused internally by `BackendClient` rather than deleted or duplicated — it remains the one literal allow-list, just no longer called directly by handlers.
- Confirm during Step 5 whether the existing handler tests exercise `handleRequest()` (which runs the middleware pipeline) or call `processsRequest()` directly (which wouldn't) — this determines exactly how much test setup needs to change now that `BackendClient`, not middleware, performs the Host/`X-Forwarded-Host` remap.
