# Issue: Request Staff Cache Size Json Failing With 403

## Description
Requests to `GET /staff/cache/size.json` (used by the staff dashboard's on-disk cache size viewer, added in #974) fail with a `403` for staff/superuser users, even though they are correctly authenticated and authorized.

## Problem
`CacheSizeHandler` (`proxy/extension/lib/handlers/CacheSizeHandler.php`) checks staff access by calling the backend's `GET .../users/status.json`, forwarding headers filtered through `ForwardedHeaderFilter` (which allow-lists `Host` alongside `Cookie`/`Authorization`).

Unlike its sibling handlers `DeleteHandler` and `UploadHandler`, `CacheSizeHandler`'s constructor never rewrites the `Host` header before making that backend call:

```php
$this->addMiddleware(new RenameHeaderMiddleware('Host', 'X-Forwarded-Host'));
$this->addMiddleware(new SetHeadersMiddleware(['Host' => $this->backendHost()]));
```

As a result, the browser-facing `Host` header (e.g. `majora.example.com`) is forwarded unchanged into the backend call instead of being rewritten to the backend's own hostname (e.g. `backend:8080`). Per `docs/agents/external/tent/host-header.md`, backends like Django commonly reject or misroute requests whose `Host` doesn't match what they expect — this is the likely cause of the 403, independent of `Cookie`/`Authorization` (both are already correctly forwarded).

Note: the Tent PR referenced in the original report (darthjee/tent#269, domain-based matcher scoping) is unrelated to this issue and should be disregarded — it was a mix-up with another issue.

## Expected Behavior
A logged-in staff or superuser user requesting `GET /staff/cache/size.json` gets a `200` with `{"size": <bytes>}`, matching `CacheSizeHandlerTest`'s existing expectations.

## Solution
Add the same `RenameHeaderMiddleware`/`SetHeadersMiddleware` pair to `CacheSizeHandler`'s constructor, mirroring `DeleteHandler`/`UploadHandler`, so the backend call carries the correct `Host` (with the original preserved under `X-Forwarded-Host`). Add matching coverage to `CacheSizeHandlerTest.php`, mirroring `DeleteHandlerTest`'s existing assertion that `Host` is overridden to the backend's own host regardless of what the incoming request carries.

## Benefits
Restores the staff cache size viewer (#974) to working order, and brings `CacheSizeHandler` in line with the Host-header-rewrite convention already established by the other custom backend-calling handlers, reducing the chance of the same bug recurring in future handlers.

## Out of Scope
`/staff/cache/size.json` is also missing from the frontend's skip-cache config (`skipCacheEndpoints.js`/`skipCacheSuffixes.js`), unlike other staff/authorization-gated endpoints. That gap doesn't cause this 403 (no proxy-side caching middleware applies to this route) and is left for a separate issue.
