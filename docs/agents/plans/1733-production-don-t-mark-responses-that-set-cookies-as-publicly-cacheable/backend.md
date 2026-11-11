# Backend Plan: Production: don't mark responses that set cookies as publicly cacheable

Main plan: [plan.md](plan.md)

## Shared contracts

- Anonymous tier (including `/permissions/`): 2xx with a cookie gets
  `private, max-age=<anon>`; 2xx without a cookie keeps `public, max-age=<anon>`; non-2xx keeps
  `no-store`. `<anon>` is `Settings.cache_control_anonymous_max_age()`.
- Authenticated, `X-Skip-Cache` and Bearer outputs are unchanged.
- The proxy's `.htaccess` will no longer override this value.

## Implementation Steps

### Step 1 — Mark cookie-setting responses private

In `backend/games/middleware.py`, `_apply_public_cache_control`: on a 2xx response, use
`private, max-age=<anon>` when `response.cookies` is not empty, and `public, max-age=<anon>`
otherwise. Update the class docstring (anonymous bullet and `/permissions/` bullet) to state
the rule.

`CacheControlMiddleware` is listed after `StatisticsSessionMiddleware` in `MIDDLEWARE`, so on
the way out it runs before the statistics middleware sets its cookie. Read
`StatisticsSessionMiddleware.__call__`: the cookie is set after `get_response` returns, and that
return value has already been through `CacheControlMiddleware`. If so, the cookie check alone
never sees the statistics cookie. In that case, fix the ordering so the cache decision is made
after every cookie is set. Preferred: move `games.middleware.CacheControlMiddleware` (and
`accounts.middleware.BearerNoCacheMiddleware`, keeping their relative order and the existing
load-bearing comment) **above** `statistics.middleware.StatisticsSessionMiddleware` in
`MIDDLEWARE`. Check that nothing else depends on the old order: `request.user` is set by
`AuthenticationMiddleware`, which stays earlier, and `HistoryRequestMiddleware` is order-neutral
here. Document the new load-bearing order in a comment, like the existing one.

### Step 2 — Tests and docs

In `backend/games/tests/middleware_test.py`:

- Unit tests with `rf` and a bare `CacheControlMiddleware`:
  - anonymous 2xx with a cookie (`response.set_cookie(...)`) gives `private, max-age=3600`;
  - anonymous 2xx without one gives `public, max-age=3600`;
  - a `/permissions/` path with a cookie gives `private`;
  - a non-2xx response with a cookie gives `no-store`;
  - a custom `MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS` is reflected in the `private` value.
- Full-stack tests (`client`) for a tracked anonymous endpoint (e.g. `/games.json`): the
  response carries the statistics cookie and its `Cache-Control` does not contain `public`
  (`private, max-age=3600`).
- Existing full-stack tests that expect `public, max-age=...` through `client`
  (`TestCacheControlMiddlewareAnonymous`, `TestCacheControlMiddlewarePermissionsPrefix`) now get
  the statistics cookie. Update them to expect `private, max-age=...`, or move the "no cookie →
  public" expectations to the `rf` unit tests. Do not weaken the authenticated, `X-Skip-Cache`,
  error or Bearer tests. Run the whole suite: other apps' tests (`accounts`, `staff`,
  `statistics`) may assert `public` too.

Docs:

- `docs/agents/access-control/common-rules.md` (the `/permissions/` public-tier passages around
  lines 107 and 133): note that a response that sets a cookie gets `private` instead of
  `public`.
- `docs/agents/statistics.md` (around line 423): add one line saying tracked responses carry the
  cookie and so are never `public`.
- `docs/agents/production-configuration.md`: mark `SESSION_COOKIE_SECURE` as required `true` in
  production (the statistics cookie and the session cookie get `Secure`), referencing #1733.

## Files to Change

- `backend/games/middleware.py`: the cookie check and docstring.
- `backend/majora_project/settings.py`: the `MIDDLEWARE` order and comment, only if Step 1's
  ordering check requires it.
- `backend/games/tests/middleware_test.py`: new and updated tests.
- Other backend tests asserting `public` through the full stack, if any.
- `docs/agents/access-control/common-rules.md`, `docs/agents/statistics.md`,
  `docs/agents/production-configuration.md`: the rule and the setting.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: backend tests).
- `backend`: ruff / complexity checks, as run by CI's Python lint job, through docker-compose.
- Docs: markdownlint (CI job: Check Markdown Lint), through docker-compose/make.

## Notes

- Middleware order is the main risk. Verify with the full-stack test, not by reasoning alone.
- Moving the cache middlewares above the statistics middleware must not change any other output.
  The full suite is the check.
- `response.cookies` also contains cookie deletions (`delete_cookie`). That is intended: a
  `Set-Cookie` header is still sent.
- Cookies set by middlewares listed above the cache middlewares (`SessionMiddleware`'s session
  cookie, `CsrfViewMiddleware`'s CSRF cookie) are still added after the cache decision. Those
  responses are mostly authenticated (`private`) already. Check whether an anonymous response can
  get one (e.g. the CSRF cookie on a login page), and if so cover it too (e.g. by placing the
  cache middlewares higher, with tests). Otherwise record it as a known gap.
- Repo is public: no real IPs, hostnames or secrets in tests or docs.
