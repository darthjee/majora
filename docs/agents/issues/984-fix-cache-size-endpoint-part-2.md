# Issue: Fix cache size endpoint part 2

## Description

The proxy's cache size endpoint (`/staff/cache/size.json`, handled by `proxy/extension/lib/handlers/CacheSizeHandler.php`) is still broken after a first fix (#979/#982). Two concrete bugs remain, and both stem from the same root cause: the three backend-proxying handlers (`CacheSizeHandler`, `DeleteHandler`, `UploadHandler`) each hand-roll their own backend HTTP call — building URLs, filtering forwarded headers, and rewriting the `Host`/`X-Forwarded-Host` headers — with the logic duplicated three times instead of shared. This issue fixes both bugs and extracts a shared `BackendClient` so the fix (and any future one) lives in one place.

## Problem

1. **Gzipped response from `/users/status.json`.** `CacheSizeHandler` calls the backend's `/users/status.json` to check staff/superuser access, then `json_decode()`s the response body. If that response ever comes back gzip-compressed (`Content-Encoding: gzip`), decoding fails, because `Tent\Http\CurlHttpExecutor\Base` (in the separate `darthjee/tent` framework repo) never decompresses the body. `DeleteHandler` and `UploadHandler` avoid the same trap only by omission — `ForwardedHeaderFilter`'s allow-list already excludes `Accept-Encoding` from every forwarded request, so none of the three handlers currently ask for gzip — but none of them can actually decode one if it arrives anyway (e.g. if something upstream of the backend compresses regardless of the request's `Accept-Encoding`).

2. **Double slash when building backend URLs.** All three handlers build backend URLs via raw string concatenation, e.g. `CacheSizeHandler::statusUrl()`'s `return $this->host . '/users/status.json';`. If the configured `host` has a trailing slash, this produces `//users/status.json`, which reaches the backend as a malformed path and pollutes logs. `DeleteHandler::deletableUrl()`/`deleteUrl()` and `UploadHandler::updateStatus()`'s URL building have the identical bug.

3. **No shared backend-request client.** The logic each handler needs — forwarded-header allow-listing (`ForwardedHeaderFilter`), Host/`X-Forwarded-Host` remapping (`RenameHeaderMiddleware` + `SetHeadersMiddleware`, wired identically in all three constructors), and URL building — is duplicated three times with no single owner, which is how bugs like #1 and #2 above end up fixed in one handler and not the others.

## Expected Behavior

- `/staff/cache/size.json` correctly resolves the caller's staff/superuser status via `/users/status.json`, even if that backend response is gzip-compressed.
- No backend URL built by any of the three proxy handlers ever contains a double slash at the host/path boundary, regardless of whether the configured `host` has a trailing slash.
- Gzip handling, URL building, forwarded-header filtering, and Host/`X-Forwarded-Host` remapping each live in exactly one place (the new `BackendClient`), used identically by `CacheSizeHandler`, `DeleteHandler`, and `UploadHandler`.

## Solution

Extract a `BackendClient` class at `proxy/extension/lib/support/BackendClient.php` (namespace `Tent\RequestHandlers`, alongside `ForwardedHeaderFilter`/`SecurePhotoStorage`/`PathTraversalGuard`), and migrate all three handlers (`CacheSizeHandler`, `DeleteHandler`, `UploadHandler`) to use it for every backend call.

### `BackendClient` responsibilities

- **Composes, not replaces, `HttpClientInterface`.** `Tent\Http\HttpClientInterface`/`CurlHttpClient` live in the separate `darthjee/tent` repo (the reverse-proxy framework dependency — see `AGENTS.md`), not in `majora-2`, so `BackendClient` can only wrap that interface, not modify its internals. Constructor: `string $host` plus an optional `?HttpClientInterface $httpClient` (defaulting to `CurlHttpClient`) — same pattern the handlers already use.
- **URL sanitization.** `url(string $path): string` joins host and path with exactly one slash (`rtrim($this->host, '/') . '/' . ltrim($path, '/')`), fixing the double-slash bug at its one true source. Scoped to the host/path join boundary only — request-derived path segments (e.g. `game_slug`) are already validated non-empty by their extraction regexes and can't introduce internal double-slashes.
- **Gzip handling.** Since a raw curl option isn't reachable from `majora-2` (see above), this is done entirely with what `HttpClientInterface::request()` already exposes: the client adds `Accept-Encoding: gzip` to the outgoing headers, and after the call returns, inspects the response's `headers` (parseable via the `tent` framework's `Tent\Utils\CurlUtils::mapHeaderLines()`) for `Content-Encoding: gzip`, `gzdecode()`-ing the body before returning it if present.
- **Forwarded-header allow-list.** Absorbs `ForwardedHeaderFilter`'s logic internally (base allow-list plus per-call extras) as the single source of truth for which headers get forwarded, instead of handlers calling a separate static class.
- **Host / `X-Forwarded-Host` remapping.** Computed directly from the raw incoming headers and the configured backend host at request time (`Host` overridden to the backend host, `X-Forwarded-Host` set from the original `Host`). This replaces the `RenameHeaderMiddleware`/`SetHeadersMiddleware` wiring currently duplicated in every handler's constructor — migrated handlers stop registering that middleware pair entirely.

### `request()` signature

```php
public function request(
    string $method,
    string $path,
    array $incomingHeaders,
    ?string $body = null,
    array $extraAllowedHeaders = [],
    array $overrideHeaders = []
): array
```

- `$incomingHeaders` — the raw, unfiltered headers off the original client request; no pre-filtering or middleware needed by the caller.
- `$extraAllowedHeaders` — per-call additions to the base forwarded-header allow-list (e.g. `UploadHandler` passes `['X-Upload-Token']`).
- `$overrideHeaders` — applied last, after filtering/host-remap (e.g. `UploadHandler` forces `['Content-Type' => 'application/json']` on its PATCH calls even though the incoming request was multipart).
- Internally: builds the URL via `url($path)`, filters `$incomingHeaders` down to the base allow-list plus `$extraAllowedHeaders`, computes `Host`/`X-Forwarded-Host`, applies `$overrideHeaders`, adds `Accept-Encoding: gzip`, calls the underlying `HttpClientInterface`, decodes gzip if present, and returns the same `{body, httpCode, headers}` shape `HttpClientInterface::request()` already returns.

### Handler migration

All three handlers — `CacheSizeHandler`, `DeleteHandler`, `UploadHandler` — build a `BackendClient` internally and route every backend call through it. Public constructor signatures are unchanged (e.g. `CacheSizeHandler::__construct(string $host, ?HttpClientInterface $httpClient = null, string $cachePath = '')` keeps accepting `$httpClient` and just passes it to `new BackendClient($host, $httpClient)`), so the `build(array $params)` factories and their YAML rule config keys (`'host'`, `'cache_path'`, `'photos_path'`, `'files_path'`) are unaffected.

### Test impact (in scope for this issue)

All three `*HandlerTest.php` files assert the exact headers passed to the mocked `HttpClientInterface::request()`. Those assertions need updating because `BackendClient` now adds `Accept-Encoding: gzip` to every outgoing request and computes `Host`/`X-Forwarded-Host` itself rather than relying on pre-applied middleware — the effective proxying behavior is equivalent aside from the new gzip header, but the exact-header assertions will fail until updated. Tests asserting the literal built backend URL also need updating to expect the sanitized single-slash form.

## Benefits

- `/staff/cache/size.json` works correctly for staff/superuser callers regardless of whether the backend's status check response is compressed.
- No more malformed double-slash backend requests polluting logs.
- Backend-request handling (gzip, URL building, header forwarding, host remapping) has one owner instead of three duplicated copies, so the next fix or feature only needs to land once.
