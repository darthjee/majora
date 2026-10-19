# Backend Plan: Scoped API tokens: keep Bearer requests out of the proxy cache

Main plan: [plan.md](plan.md)

## Shared contracts

- Bearer detection: reuse `accounts.authentication.BEARER_PATTERN`
  (`(^|,)\s*bearer(\s|$)`, case-insensitive) on the whole `HTTP_AUTHORIZATION` value. Don't
  define a second regex.
- Every response to a Bearer request carries `X-Skip-Cache: true` **and**
  `Cache-Control: no-store`, whatever the status.
- The backend never reads `X-Bearer-Request` (Django is reachable directly on Render, so it can't
  be trusted).

## Implementation Steps

### Step 1 — Add the Bearer no-cache middleware

Add `BearerNoCacheMiddleware` to a new `backend/accounts/middleware.py`, next to the
authentication code that owns `BEARER_PATTERN`. Follow
`games.middleware.CacheControlMiddleware`'s style (a class docstring, `__init__(get_response)`
and `__call__`). On the way out, if `BEARER_PATTERN.search(request.META.get('HTTP_AUTHORIZATION',
''))` matches, set `response['X-Skip-Cache'] = 'true'` and `response['Cache-Control'] =
'no-store'`. Leave every other response alone.

### Step 2 — Register it and test it

In `backend/majora_project/settings.py`, insert `'accounts.middleware.BearerNoCacheMiddleware'`
directly **after** `'games.middleware.CacheControlMiddleware'` in `MIDDLEWARE`. Being later in the
list, it runs first on the response, so `CacheControlMiddleware` sees `X-Skip-Cache: true` and
keeps `no-store` instead of choosing `public`/`private` from `request.user`. Add a comment saying
that the order is load-bearing.

Tests in `backend/accounts/tests/middleware_test.py`:

- Bearer requests produce both headers on 200, 401, 403, 404 (an unknown URL, Django-level) and
  500 (a view that raises, with `raise_request_exception=False` or the middleware called directly
  with a 500 response). Cover the variants `bearer`, `BEARER`, a tab separator and
  `Token x, Bearer y`.
- `Token` and session responses keep their current `Cache-Control` and get no forced
  `X-Skip-Cache`.
- A forged `X-Bearer-Request` header on a non-Bearer request has no effect.
- An order assertion: `MIDDLEWARE.index(BearerNoCache) > MIDDLEWARE.index(CacheControl)`.

## Files to Change

- `backend/accounts/middleware.py` — new `BearerNoCacheMiddleware`.
- `backend/majora_project/settings.py` — register it after `CacheControlMiddleware`.
- `backend/accounts/tests/middleware_test.py` — new tests.

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` and `ruff check .` (CI jobs:
  `pytest_all`, `checks`)

## Notes

- Until #1630–#1639 open views to Bearer tokens, most Bearer requests end in 401. Tests should
  still cover a 200 using a view that already accepts scoped tokens if one exists (for example a
  #1604 token endpoint), or by calling the middleware directly with a stub 200 response.
