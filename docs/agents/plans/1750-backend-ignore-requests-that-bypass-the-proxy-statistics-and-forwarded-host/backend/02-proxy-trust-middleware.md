# Proxy-trust middleware and settings

Add `common/middleware.py` with `ProxyTrustMiddleware`, using the same
`__init__(get_response)` / `__call__(request)` shape as `games.middleware.CacheControlMiddleware`.

On each request:

1. `request.via_proxy = is_via_proxy(request)`.
2. If the request is untrusted, `request.META.pop('HTTP_X_FORWARDED_HOST', None)`.
3. If the request is untrusted, `enforce_enabled()` is true, `proxy_secret()` is non-empty and
   `request.path_info` is not in `ENFORCEMENT_EXEMPT_PATHS = frozenset({'/ready.json'})`
   (exact match): return `JsonResponse({'detail': 'Forbidden'}, status=403)` with
   `Cache-Control: no-store` (reuse `common/cache_control.py` if it fits). No logging.
4. Otherwise `return self.get_response(request)`.

In `majora_project/settings.py`:

- Add `'common.middleware.ProxyTrustMiddleware'` as the **first** `MIDDLEWARE` entry (above
  `CorsMiddleware` and `SecurityMiddleware`), with a load-bearing ordering comment: it must
  run before anything calls `request.get_host()` (CSRF, domain views, statistics).
- Rewrite the comment above `USE_X_FORWARDED_HOST`: the header is now gated by
  `PROXY_SECRET` through `ProxyTrustMiddleware`, and any future trust of a forwarded header
  (e.g. `SECURE_PROXY_SSL_HEADER`, `USE_X_FORWARDED_PORT`) must be gated by
  `request.via_proxy` too.

Tests (`common/tests/middleware_test.py`, using the Django test client and real routes):

- an empty secret: `via_proxy` is true, and `X-Forwarded-Host` is honored (e.g. `/games.json`
  resolves a registered domain);
- a secret set with a matching header: same as above;
- a secret set with a missing or wrong header: `X-Forwarded-Host` is ignored (`/games.json`
  returns 404 `domain_not_recognized`, `/domain/config.json` returns default branding), and the
  request is still served (soft mode);
- `PROXY_ENFORCE=true` with an untrusted request: 403, the exact body, `no-store`;
  `/ready.json` gives 200, `/ready.json/` doesn't get the exemption, and a trusted request
  gives 200;
- `PROXY_ENFORCE=true` with an empty secret: no 403;
- the ordering assertion: `MIDDLEWARE[0]` is the proxy-trust middleware.

## Files to Change

- `backend/common/middleware.py` — new `ProxyTrustMiddleware`.
- `backend/majora_project/settings.py` — `MIDDLEWARE` first entry and comments.
- `backend/common/tests/middleware_test.py` — new tests.
