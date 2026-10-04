# Proxy Plan: Client IP integrity: backend directly reachable and X-Forwarded-For trusted as-is

Main plan: [plan.md](plan.md)

## Shared contracts

- Send `X-Proxy-Secret: <secret>` on every request proxied to Django, where `<secret>` is the rule's configured `$proxySecret`. When the secret is empty, send nothing.
- Always strip any client-supplied `X-Proxy-Secret` (case-insensitive), whether or not a secret is configured.
- Keep the existing `X-Forwarded-For` behavior: replace the header with a single `REMOTE_ADDR` value.
- `$proxySecret` comes from `locals.php`. Dev: `getenv('PROXY_SECRET') ?: ''`. Prod: the server-side file, documented in `locals.php.sample`.

## Implementation Steps

### Step 1 — Add an optional `secret` attribute to `SetClientIpMiddleware`
Extend `SetClientIpMiddleware::build()` to accept an optional `secret` attribute (default `''`). In `processRequest`:
- Remove every `X-Proxy-Secret` header case-insensitively, the same way `X-Forwarded-For` is removed today.
- When the secret is non-empty, set `X-Proxy-Secret` to it.

Keeping both headers in one middleware means a rule can't set the client IP without also authenticating it. Update the class docblock: the "exactly one hop / `http://backend:8080`" premise is wrong in production, where Django is a public Render host. The middleware authenticates the IP with the shared secret, and Django ignores `X-Forwarded-For` without it. Configuration usage example: `['class' => 'Tent\\Middlewares\\SetClientIpMiddleware', 'secret' => $proxySecret]`.

Tests in `SetClientIpMiddlewareTest.php`:
- the secret is set when configured;
- a client-supplied `X-Proxy-Secret` (any case) is stripped and replaced when a secret is configured;
- it is stripped and not re-added when the secret is empty or missing;
- existing `X-Forwarded-For` tests still pass;
- `build([])` and `build(['secret' => 'x'])` both work.

### Step 2 — Wire the middleware on every rule that proxies to Django
In both `prod_configuration/rules/` and `dev_configuration/rules/`:
- Add `SetClientIpMiddleware` with `'secret' => $proxySecret` to `private_game_data_cache.php`, `admin.php` and `redirects.php`. Add it before any other middleware, so it runs before `RedirectMiddleware` and `CacheStalenessMiddleware`.
- Add `'secret' => $proxySecret` to the existing entry in `backend.php`.

Check `cache.php`, `domain.php`, `delete.php` and `uploads.php` too: if any of them proxies to `$backendHost` or `http://backend:8080`, wire it the same way. Update the file docblocks where they describe middlewares.

Define `$proxySecret`:
- `prod_configuration/locals.php.sample`: add `$proxySecret = '';` with a comment saying the server-side `locals.php` must hold the same value as Render's `PROXY_SECRET`.
- `dev_configuration/locals.php`: add `$proxySecret = getenv('PROXY_SECRET') ?: '';`.

`DomainRouteOrderingTest` loads the prod configuration with `locals.php.sample`, so the sample must define the variable.

## Files to Change
- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php`: optional `secret` attribute; strip and set `X-Proxy-Secret`; updated docblock.
- `proxy/extension/tests/middlewares/SetClientIpMiddlewareTest.php`: new cases for the secret header.
- `proxy/prod_configuration/rules/{backend,private_game_data_cache,admin,redirects}.php`: wire the middleware with the secret.
- `proxy/dev_configuration/rules/{backend,private_game_data_cache,admin,redirects}.php`: same as prod.
- `proxy/prod_configuration/locals.php.sample`: `$proxySecret`.
- `proxy/dev_configuration/locals.php`: `$proxySecret` from the environment.

## CI Checks
- `proxy`: `docker-compose run --rm proxy_tests`, plus the proxy lint jobs defined in `.circleci/config.yml`.

## Notes
- `BackendClient` (used by `CacheStalenessMiddleware` for its own backend calls) is out of scope. It sends no client IP, so Django records the caller's `REMOTE_ADDR` there, same as today.
- Prod rollout is manual and outside the repo. The owner must add `$proxySecret` to the server-side `locals.php` and set `PROXY_SECRET` on Render with the same value.
