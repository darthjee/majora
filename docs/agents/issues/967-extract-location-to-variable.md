# Extract location to variable

## Context

Proxy configuration (prod or dev) currently has some hardcoded paths. For example, `proxy/prod_configuration/rules/files.php:8`.

In production we keep a file for secrets/variables that is not committed to the repository, `proxy/prod_configuration/locals.php`, with a sample checked in at `proxy/prod_configuration/locals.php.sample`.

The hardcoded value `/home/moria_user/moria.ffavs.net` is treated as a secret, not just a config convenience: it leaks the production server's username and domain into a committed file. It currently appears in:

- `proxy/prod_configuration/rules/files.php:8`
- `proxy/prod_configuration/rules/photos.php:8`
- `proxy/prod_configuration/rules/frontend.php:8` and `:24` (as `/home/moria_user/moria.ffavs.net/static`)

## What needs to be done

Extract these hardcoded paths into `proxy/prod_configuration/locals.php.sample` (with a placeholder value), consumed by the three rule files the same way `$backendHost`/`$photosPath`/`$filesPath` already are.

A single new variable, `$staticRoot`, should be added to `locals.php.sample` (and consumed the same way in the real, uncommitted `locals.php`):

```php
$staticRoot = '/home/moria_user/moria.ffavs.net';
```

Usage:
- `files.php` and `photos.php`: `'location' => $staticRoot`
- `frontend.php` (both rules): `'location' => $staticRoot . '/static'`

One variable is used rather than one per rule file, since all three currently share the exact same base path — separate variables would just be redundant duplication of the same value.

Out of scope for this issue:
- `./cache` in `proxy/prod_configuration/rules/backend.php` — this is a relative path local to the proxy's own working directory, not an environment-specific/sensitive deployment path, so it stays hardcoded.
- Updating the real (uncommitted) production `locals.php` — this is a deployment-time change, not a repository change.
- `proxy/dev_configuration` — it has no `locals.php`/secrets mechanism today, and its hardcoded `location` values are local dev paths rather than a production server secret. This issue only touches `proxy/prod_configuration`.

## Acceptance criteria

- [ ] `proxy/prod_configuration/locals.php.sample` defines a new `$staticRoot` variable with a placeholder value.
- [ ] `proxy/prod_configuration/rules/files.php` uses `$staticRoot` instead of the hardcoded path for `'location'`.
- [ ] `proxy/prod_configuration/rules/photos.php` uses `$staticRoot` instead of the hardcoded path for `'location'`.
- [ ] `proxy/prod_configuration/rules/frontend.php` uses `$staticRoot . '/static'` instead of the hardcoded path for `'location'` in both rules.
- [ ] No committed file still contains the literal string `/home/moria_user/moria.ffavs.net`.
- [ ] `proxy/dev_configuration` is left untouched.
