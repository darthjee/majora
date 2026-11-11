# Issue: Statistics bug fix: proxy custom handlers forward the signed client IP

## Description

Part of the statistics bug fix Epic (Epic #1736). Requests served through the Tent custom
handlers must reach the backend with the signed client IP, like every other proxied request.

Background: `docs/agents/specs/statistics-bug/findings.md`, hypothesis 1 (reproduced by the
`emulate.py` scenario `mixed_handlers`).

Still relevant after #1737 and #1732: #1737 stopped splitting the session on an IP change and
#1732 restored the production proxy secret, but the custom-handler routes still record the
proxy's own IP. That pollutes `Session.ip` and the visit's `last_ip`, and the session's IP
flips back and forth as the visitor moves between handler and non-handler routes.

## Problem

Every backend call made by a custom handler goes through `BackendClient`
(`proxy/extension/lib/support/BackendClient.php`):

- `UploadHandler` and `LinkHandler` (`rules/uploads.php`), including their
  `UploadStatusClient` calls;
- `DeleteHandler` (`rules/delete.php`);
- `CacheSizeHandler` and `CacheClearHandler` (`rules/cache.php`);
- `StaffAccessGuard`'s `/users/status.json` check, used by the handlers above.

`BackendClient` forwards an allow-list of headers (`ForwardedHeaderFilter`) that includes
`Cookie` but not `X-Forwarded-For` or `X-Proxy-Secret`, and these rules declare no
`SetClientIpMiddleware`. The backend therefore falls back to `REMOTE_ADDR` (the
infrastructure IP) for these calls while it still attaches them to the visitor's statistics
session through the cookie.

## Expected Behavior

- Every `BackendClient` call sends `X-Forwarded-For` set to Tent's view of the client
  (`$_SERVER['REMOTE_ADDR']`) and, when a secret is configured, `X-Proxy-Secret` — the same
  values `SetClientIpMiddleware` sets on ordinary proxied requests.
- A client-supplied `X-Forwarded-For` or `X-Proxy-Secret` is never trusted or passed through
  (both stay off `ForwardedHeaderFilter`'s allow-list; `BackendClient` sets them itself).
- An empty secret sends no `X-Proxy-Secret`, matching the middleware.
- The backend records the same client IP for handler routes as for every other route.

## Solution

1. Extract the header logic of `SetClientIpMiddleware` into a shared helper (e.g. a small
   `ClientIpHeaders` support class returning the two headers from a remote address and a
   secret), and make the middleware use it — its behaviour and tests stay unchanged.
2. `BackendClient` takes the proxy secret (constructor argument, default `''`) and applies the
   helper's headers to every outgoing request, after the allow-list filter and before
   `$overrideHeaders`. The remote address is read from `$_SERVER['REMOTE_ADDR']` behind an
   injectable seam so tests don't touch the superglobal.
3. Each custom handler accepts a `secret` handler attribute (same name as the middleware's) and
   passes it to its `BackendClient`. Wire `'secret' => $proxySecret` into the handler config of
   `rules/uploads.php`, `rules/delete.php` and `rules/cache.php`, in both
   `prod_configuration` and `dev_configuration`.
4. Tests (phpunit):
   - `BackendClient`: `X-Forwarded-For` set from the remote address; `X-Proxy-Secret` sent
     with a secret and absent without one; client-supplied values of both (any casing) dropped.
   - The helper: same cases; `SetClientIpMiddleware`'s existing tests still pass.
   - Each handler's `build()` passes the `secret` through.
5. Update the proxy docs (`docs/agents/architecture/proxy.md`) where `SetClientIpMiddleware`
   and the custom handlers are described.

## Out of scope

- Backend changes (the backend already trusts `X-Forwarded-For` only with a matching secret).
- Excluding the handlers' internal backend calls (`/users/status.json`, upload status updates)
  from statistics tracking.
- The production secret value itself (configured by #1732).

## Verification

- `proxy_extension_tests` in CI (phpcs, phpunit).
- Locally, with the dev stack and a proxy secret configured: an upload or photo delete records
  the client IP, not the proxy's, on the visitor's session and visit.

## Privacy

The repository is public: no real IPs, secrets or production hostnames in this issue or its
PR (use documentation IP ranges in tests).

### Responsible agent

proxy
