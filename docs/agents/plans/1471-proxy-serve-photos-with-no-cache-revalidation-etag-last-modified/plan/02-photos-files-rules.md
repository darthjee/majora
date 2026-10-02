# Switch photos/files rules to conditional + no-cache
In both environments, update the `/photos` and `/files` rules:
- Add `'conditional' => true` to the `static` handler, so Tent emits `ETag` / `Last-Modified` and
  answers conditional GETs with `304`.
- Replace the `CacheControlMiddleware` `maxAgeSeconds => 604800` with `directive => 'no-cache'`.

Leave every other rule (`/static/*`, frontend, domain, API) untouched.

## Files to Change
- `proxy/dev_configuration/rules/photos.php`
- `proxy/dev_configuration/rules/files.php`
- `proxy/prod_configuration/rules/photos.php`
- `proxy/prod_configuration/rules/files.php`
