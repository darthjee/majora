# Remove double Cache-Control header

## Context

API JSON responses are currently sent with two separate `Cache-Control` headers instead of one, e.g.:

```
cache-control: public, max-age=3600
cache-control: max-age=172800
```

The first header (`public, max-age=3600`) matches what `games.middleware.CacheControlMiddleware` (`source/games/middleware.py`) sets for anonymous requests, based on `Settings.cache_control_anonymous_max_age()`.

The second header (`max-age=172800`, with no `public`/`private` qualifier) does not come from anywhere in the Django app: Django's built-in cache middleware is not enabled in `MIDDLEWARE` (`source/majora_project/settings.py`), and no view/decorator in `games` sets `Cache-Control`. It also does not match the `maxAgeSeconds => 10` configured for `Tent\Middlewares\CacheStalenessMiddleware` in the proxy rules (`proxy/prod_configuration/rules/backend.php`). It likely originates from the Tent proxy's `default_proxy` handler itself (docker image `darthjee/tent`, external to this repo), which may add its own default browser-facing `Cache-Control` header for cached responses.

Sending two `Cache-Control` headers is invalid/ambiguous per HTTP semantics — browsers and intermediate caches may pick either one, leading to unpredictable caching behavior.

## What needs to be done

Each JSON API response should carry exactly one `Cache-Control` header: the value set by `CacheControlMiddleware` (public/private, anon vs. authenticated max-age). The proxy must pass this value through untouched instead of adding its own.

- Proxy: add a custom Tent middleware in `proxy/extension/lib/` (following the existing `TestHeaderMiddleware` pattern) that runs after the proxy's own handler and collapses `Cache-Control` down to the single value produced by the Django backend, dropping any extra value added upstream by the `default_proxy` handler.
- Proxy: register the new middleware in the `middlewares` list of both `proxy/prod_configuration/rules/backend.php` and `proxy/dev_configuration/rules/backend.php`, alongside the existing `CacheCleanupMiddleware`/`CacheStalenessMiddleware` entries.
- Keep the fix entirely within this repo's proxy extension mechanism, with no changes needed to the external `darthjee/tent` project.

## Acceptance criteria

- [ ] JSON API responses carry exactly one `Cache-Control` header, matching the value produced by `games.middleware.CacheControlMiddleware`.
- [ ] Any extra/duplicate `Cache-Control` value added upstream by the proxy's `default_proxy` handler is removed before the response reaches the client.
- [ ] The new middleware is registered in both `proxy/prod_configuration/rules/backend.php` and `proxy/dev_configuration/rules/backend.php`.
- [ ] Proxy tests cover the new middleware's header-collapsing behavior.

Tags: :shipit:
