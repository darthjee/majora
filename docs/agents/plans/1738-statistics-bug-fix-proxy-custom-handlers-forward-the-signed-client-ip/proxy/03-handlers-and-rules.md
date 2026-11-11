# Handlers accept a secret and rules wire it

Each handler that builds a `BackendClient` accepts an optional `secret` handler attribute in
`build()` (default `''`), passes it to its constructor (new trailing argument, default `''`) and
on to `new BackendClient($host, $httpClient, $secret)`. `UploadStatusClient` and
`StaffAccessGuard` receive the handler's client, so they need no change.

Handlers: `UploadHandler`, `LinkHandler`, `DeleteHandler`, `CacheSizeHandler`,
`CacheClearHandler`.

Wire `'secret' => $proxySecret` into the `handler` array of every custom-handler rule, in both
configurations:

- `prod_configuration/rules/uploads.php` (Upload and Link), `delete.php`, `cache.php` (size and
  clear);
- the same three files under `dev_configuration/rules/`.

Check how `$proxySecret` is defined for the dev configuration (`dev_configuration/locals.php`)
and keep it consistent with the other rules that already pass it to `SetClientIpMiddleware`.

## Files to Change

- `proxy/extension/lib/handlers/UploadHandler.php`, `LinkHandler.php`, `DeleteHandler.php`,
  `CacheSizeHandler.php`, `CacheClearHandler.php` — `secret` attribute and constructor argument;
  docblocks.
- `proxy/prod_configuration/rules/uploads.php`, `delete.php`, `cache.php` — `'secret' =>
  $proxySecret`.
- `proxy/dev_configuration/rules/uploads.php`, `delete.php`, `cache.php` — same.
- `proxy/extension/tests/handlers/*HandlerTest.php` — `build()` passes the secret through (e.g.
  a backend call made by the built handler carries `X-Proxy-Secret`), and no secret means no
  header.
- `proxy/extension/tests/configuration/` — if a configuration test asserts rule shapes, extend
  it for the new attribute.
