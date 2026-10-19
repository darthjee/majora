# Plan: Scoped API tokens: keep Bearer requests out of the proxy cache

Issue: [1643-scoped-api-tokens-keep-bearer-requests-out-of-the-proxy-cache.md](../../issues/1643-scoped-api-tokens-keep-bearer-requests-out-of-the-proxy-cache.md)

## Overview

Keep every Bearer (scoped API token) request out of the Tent proxy cache before any view accepts
scoped tokens (#1630–#1639). A new proxy middleware, `BearerSkipCacheMiddleware`, marks Bearer
requests so both caching rules skip the cache read and write. The private rule also stops caching
requests without an `X-Cache-Token`. A backend Django middleware adds `X-Skip-Cache: true` and
`Cache-Control: no-store` to every Bearer response as a safety net. The design is fixed by
[`token-api.md`](../../specs/client/token-api.md#caching-proxy-and-navi).

## Agents involved

- [proxy](proxy.md)
- [backend](backend.md)

The architect does the documentation step (see [Docs](#docs) below) after both agents finish.

## Shared contracts

- **Bearer detection (identical in both agents):** a request is a Bearer request when its whole
  `Authorization` value (several headers joined with `,`) matches the case-insensitive regex
  `(^|,)\s*bearer(\s|$)`. The backend already defines it as
  `accounts.authentication.BEARER_PATTERN`; the proxy uses the PHP equivalent
  `/(^|,)\s*bearer(\s|$)/i`.
- **`X-Skip-Cache: true`:** the request marker for `rules/backend.php` (set by the proxy
  middleware) and a response header on every Bearer response (set by the backend middleware).
- **`X-Bearer-Request: true`:** the request marker for `rules/private_game_data_cache.php`, set
  by the proxy middleware only. The backend never reads it.
- **`Cache-Control: no-store`:** on every Bearer response, whatever the status.
- Inbound marker headers are not stripped. Spoofing one only skips the sender's own cache.

## Docs

Done by the architect after both agents finish:

- `docs/agents/specs/client/token-api.md`, *Caching, proxy and Navi*: mark it as implemented by
  #1643 and record the final mechanism used for the missing-`X-Cache-Token` guard.
- `docs/agents/architecture/proxy.md`: add a section on `BearerSkipCacheMiddleware` (the marker
  headers, why it is prepended, and the missing-token guard on the private rule).
- `docs/agents/no-private-cache-routes.md` / `docs/agents/cache-warmer.md`: one line each
  saying that Bearer requests never touch the cache (Navi is unchanged).
- Mark #1643 as implemented wherever the client specs index lists the epic's sub-issues
  (`docs/agents/specs/client.md`), the same way #1608 was recorded.
