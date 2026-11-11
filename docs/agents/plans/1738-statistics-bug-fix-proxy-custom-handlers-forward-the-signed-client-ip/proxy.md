# Plan: Statistics bug fix: proxy custom handlers forward the signed client IP

Issue: [1738-statistics-bug-fix-proxy-custom-handlers-forward-the-signed-client-ip.md](../../issues/1738-statistics-bug-fix-proxy-custom-handlers-forward-the-signed-client-ip.md)

## Overview

`BackendClient` (used by `UploadHandler`, `LinkHandler`, `DeleteHandler`,
`CacheSizeHandler`, `CacheClearHandler`, `UploadStatusClient` and `StaffAccessGuard`)
forwards an allow-list of headers that excludes `X-Forwarded-For` and `X-Proxy-Secret`, and
the custom-handler rules declare no `SetClientIpMiddleware`. The backend therefore records the
proxy's IP for these calls while attaching them to the visitor's statistics session through the
cookie. This plan makes `BackendClient` set both headers itself.

## Context

- `SetClientIpMiddleware` (`proxy/extension/lib/middlewares/SetClientIpMiddleware.php`)
  removes any client-supplied `X-Forwarded-For`/`X-Proxy-Secret` (case-insensitively), sets
  `X-Forwarded-For` to `$_SERVER['REMOTE_ADDR']` and, with a non-empty secret, sets
  `X-Proxy-Secret`.
- `ForwardedHeaderFilter` already drops both headers; keep it that way so a client-supplied
  value can never pass through.
- Decided in the issue discussion: the secret reaches the handlers as a `secret` handler
  attribute (same name as the middleware's), not by adding the middleware to the rules.

## Steps

- [01 — Extract the client-IP header helper](proxy/01-client-ip-header-helper.md)
- [02 — BackendClient sets the signed client IP](proxy/02-backend-client-signed-ip.md)
- [03 — Handlers accept a secret and rules wire it](proxy/03-handlers-and-rules.md)
- [04 — Documentation](proxy/04-documentation.md)

## CI Checks

- `proxy`: `docker-compose run --rm proxy_tests` (phpunit; CI job: `proxy_extension_tests`)
- `proxy`: phpcs with `proxy/phpcs.xml` inside the `darthjee/tent-test:1.0.2` image, as CI runs
  it (CI job: `proxy_extension_tests`)
- docs: markdownlint (CI job: `markdownlint`)

## Notes

- Tests must not leak `$_SERVER['REMOTE_ADDR']`: save and restore it the way
  `SetClientIpMiddlewareTest` does, or inject the remote address.
- Use documentation IP ranges (e.g. `192.0.2.0/24`, `203.0.113.0/24`) and dummy secrets in
  tests; the repository is public.
- Never log or print the secret.
- `locals.php.sample` already defines `$proxySecret`; no new configuration variable is needed.
- Out of scope: backend changes, and excluding the handlers' internal calls
  (`/users/status.json`, upload status updates) from statistics tracking.
