# Proxy Plan: Add statistics

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — this agent is the sole producer of the
`X-Forwarded-For` header the backend trusts for the visitor's IP. `backend`'s middleware only
ever reads it; this agent is responsible for making sure the value it carries is always Tent's
own view of the client address, never something the client can override.

## Implementation Steps

### Step 1 — New `SetClientIpMiddleware`

None of Tent's existing middlewares (`SetHeadersMiddleware`, `RenameHeaderMiddleware`,
`CacheControlMiddleware` in `proxy/extension/lib/middlewares/`) can inject a *dynamic*,
per-request value — `SetHeadersMiddleware` only writes static, config-supplied header values (see
`docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`'s "SetHeadersMiddleware" section). Getting the
real client IP into the request requires a new custom middleware, following the
`CacheControlMiddleware.php` pattern (custom middlewares live in `proxy/extension/lib/middlewares/`,
tests in `proxy/extension/tests/`, namespace `Tent\Middlewares`):

Create `proxy/extension/lib/middlewares/SetClientIpMiddleware.php`:

- Before writing the class, confirm the exact request-mutation hook exposed by the installed
  `darthjee/tent` version (`composer install` inside `proxy/extension/` to pull the package, then
  inspect `vendor/darthjee/tent/.../Middleware.php`) — `CacheControlMiddleware` only needed
  `processResponse(Response $response): Response` because it never touches the request; this one
  needs the request-side counterpart (most likely `processRequest(Request $request): Request`,
  mirroring the response method's shape, but verify rather than assume).
- Implementation: **unconditionally overwrite** the `X-Forwarded-For` header on the outgoing
  request with the current request's own remote address (PHP's `$_SERVER['REMOTE_ADDR']`, as
  surfaced through whatever `Request` accessor the installed Tent version exposes for it — check
  the same vendor source for the accessor name). "Overwrite," not "set if absent," is the whole
  point: a client that sends its own `X-Forwarded-For` must never have that value survive to
  Django, or it could spoof the IP the backend's statistics module records.
- No constructor attributes are needed (unlike `CacheControlMiddleware`'s `maxAgeSeconds`) — this
  middleware's behavior isn't configurable, so a bare no-arg `build()` returning `new self()` is
  enough if the base class requires one.

### Step 2 — Wire it into the backend routing rule

In `proxy/dev_configuration/rules/backend.php` and
`proxy/prod_configuration/rules/backend.php`, add the new middleware to the existing
`'middlewares'` array for the `.json` → `http://backend:8080` rule, alongside
`CacheCleanupMiddleware`/`CacheStalenessMiddleware`. Since it mutates the *request* rather than
the response, place it first in the list so it runs before any response-side middleware and
before the request reaches `default_proxy`'s own `Host`-header handling.

### Step 3 — Tests

`proxy/extension/tests/middlewares/SetClientIpMiddlewareTest.php` (mirrors
`CacheControlMiddlewareTest`'s shape, one level down in `tests/middlewares/`):

- No incoming `X-Forwarded-For` on the request → the outgoing request carries one, set to the
  request's remote address.
- Incoming request already carries a (potentially spoofed) `X-Forwarded-For` → it is fully
  replaced, not appended to or left in place.
- Every other request header is left untouched (same "only touch what you own" assertion style as
  `PhotoUploadHandlerTest::testOnlyAllowListedHeadersAreForwardedToBackend`).

## Files to Change

- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php` — new.
- `proxy/extension/tests/middlewares/SetClientIpMiddlewareTest.php` — new.
- `proxy/dev_configuration/rules/backend.php` — add the middleware to the `.json` rule.
- `proxy/prod_configuration/rules/backend.php` — same, kept in sync with dev.

## CI Checks

- `proxy`: PHPUnit run for `proxy/extension/tests/` (check `.circleci/config.yml`'s `checks`/proxy
  job for the exact command already used for existing `proxy/extension/tests/` coverage, and
  follow that same invocation for the new test file — no new CI job should be needed).

## Notes

- This middleware is intentionally the *only* place `X-Forwarded-For` is touched on the proxy
  side — it doesn't need to know anything about statistics sessions, cookies, or the backend's
  `Session` model; it just guarantees one trustworthy fact (the real client IP) for whatever
  backend code chooses to consume it.
- Confirming the exact base-class method name (Step 1) before writing code is called out
  explicitly because `proxy/extension/vendor/` isn't populated in this checkout (no
  `composer install` has been run here) — the exact `Request`/`Middleware` API surface could not
  be verified while writing this plan.
