# Proxy Plan: Add domain configuration

Main plan: [plan.md](plan.md)

## Shared contracts

Serves the `/domain/` URL prefix as static files, backed by the `domain/` folder `infra` (see its plan) deploy-links into each release root. See [plan.md](plan.md)'s "Shared contracts" for why this exact directory name must match across proxy/infra/backend.

## Implementation Steps

### Step 1 — New `domain.php` rule

Add `proxy/prod_configuration/rules/domain.php` and `proxy/dev_configuration/rules/domain.php`, each mirroring the existing `photos.php` rule (`proxy/{prod,dev}_configuration/rules/photos.php`) almost exactly: a single `Configuration::buildRule()` call with `handler.type = 'static'`, matching `GET` + `begins_with '/domain'`, plus the same `CacheControlMiddleware` used by `photos.php`/`files.php`. No `UploadHandler`/`DeleteHandler`/cache_cleanup wiring is needed — unlike `photos`/`files`, favicon files are dropped in manually rather than through the app's upload/delete API, and no backend JSON response embeds a favicon path that would need cache invalidation.

### Step 2 — Wire the rule into `configure.php`

Add `require_once __DIR__ . '/rules/domain.php';` to both `proxy/prod_configuration/configure.php` and `proxy/dev_configuration/configure.php`, alongside the existing `photos.php`/`files.php` requires, before the catch-all redirect.

## Files to Change

- `proxy/prod_configuration/rules/domain.php` (new)
- `proxy/dev_configuration/rules/domain.php` (new)
- `proxy/prod_configuration/configure.php` — add the `require_once`
- `proxy/dev_configuration/configure.php` — add the `require_once`

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`) — lint only; no new PHPUnit test is expected, matching `photos.php`/`files.php`, which have no dedicated test of their own either.

## Notes

- Dev's bind-mount target (`/var/www/html/domain`) must match whatever `infra` mounts in `docker-compose.yml` for the `majora_proxy` service — see [infra.md](infra.md).
