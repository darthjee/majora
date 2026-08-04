# Plan: Extract location to variable

Issue: [967-extract-location-to-variable.md](../../issues/967-extract-location-to-variable.md)

## Overview

Replace the hardcoded production static-root path `/home/moria_user/moria.ffavs.net` — which leaks the production server's username and domain — with a new `$staticRoot` variable defined in `proxy/prod_configuration/locals.php.sample`, consumed by the three rule files that currently hardcode it.

## Context

`proxy/prod_configuration` already has a `locals.php`/`locals.php.sample` mechanism for environment-specific values not meant to be committed (`$backendHost`, `$photosPath`, `$filesPath`), loaded once via `require_once __DIR__ . '/locals.php';` in `proxy/prod_configuration/configure.php` before any rule file is required — so any variable defined there is in scope for every rule file. Three rule files still hardcode the production path directly instead of using this mechanism:

- `proxy/prod_configuration/rules/files.php:8` — `'location' => '/home/moria_user/moria.ffavs.net'`
- `proxy/prod_configuration/rules/photos.php:8` — `'location' => '/home/moria_user/moria.ffavs.net'`
- `proxy/prod_configuration/rules/frontend.php:8` and `:24` — `'location' => '/home/moria_user/moria.ffavs.net/static'`

`./cache` in `proxy/prod_configuration/rules/backend.php` and `proxy/dev_configuration` are explicitly out of scope (see issue).

## Implementation Steps

### Step 1 — Add `$staticRoot` to `locals.php.sample`

Add a new variable to `proxy/prod_configuration/locals.php.sample`, following the existing style of `$backendHost`/`$photosPath`/`$filesPath`:

```php
$staticRoot = '/home/moria_user/moria.ffavs.net';
```

Since `locals.php.sample` is the template developers/ops copy to the real (uncommitted) `locals.php`, keep the placeholder value equal to the current production value (consistent with how the other three variables are already sampled with real-looking defaults).

### Step 2 — Consume `$staticRoot` in `files.php` and `photos.php`

In `proxy/prod_configuration/rules/files.php` and `proxy/prod_configuration/rules/photos.php`, replace:

```php
'location' => '/home/moria_user/moria.ffavs.net'
```

with:

```php
'location' => $staticRoot
```

### Step 3 — Consume `$staticRoot` in `frontend.php`

In `proxy/prod_configuration/rules/frontend.php`, replace both occurrences of:

```php
'location' => '/home/moria_user/moria.ffavs.net/static'
```

with:

```php
'location' => $staticRoot . '/static'
```

### Step 4 — Verify no leftover hardcoded references

Confirm no committed file under `proxy/` (or elsewhere) still contains the literal string `/home/moria_user/moria.ffavs.net`, other than as a comment/example (e.g. the existing doc comment in `proxy/extension/lib/handlers/UploadHandler.php`, which references `moria.ffavs.net` only as an illustrative example and does not hold this specific path — leave it untouched).

## Files to Change

- `proxy/prod_configuration/locals.php.sample` — add `$staticRoot` variable.
- `proxy/prod_configuration/rules/files.php` — use `$staticRoot` instead of the hardcoded path.
- `proxy/prod_configuration/rules/photos.php` — use `$staticRoot` instead of the hardcoded path.
- `proxy/prod_configuration/rules/frontend.php` — use `$staticRoot . '/static'` instead of the hardcoded path (both rules).

## CI Checks

No CircleCI job currently exercises `proxy/prod_configuration` (the `proxy_tests` docker-compose service and CI jobs only cover `proxy/extension`). As a manual sanity check, run PHP lint over the changed files via the proxy's PHP tooling:

```bash
docker-compose run --rm majora_proxy php -l prod_configuration/locals.php.sample
docker-compose run --rm majora_proxy php -l prod_configuration/rules/files.php
docker-compose run --rm majora_proxy php -l prod_configuration/rules/photos.php
docker-compose run --rm majora_proxy php -l prod_configuration/rules/frontend.php
```

## Notes

- This is a config-only change; no PHP logic, tests, or deploy scripts change.
- Updating the real (uncommitted) production `locals.php` is out of scope — that's a deployment-time action, not part of this PR.
- `proxy/dev_configuration` is untouched — it has no `locals.php` mechanism and its hardcoded paths are local dev paths, not a production secret.
