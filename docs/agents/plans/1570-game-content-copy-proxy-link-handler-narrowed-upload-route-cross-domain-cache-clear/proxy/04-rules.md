# Rules: narrowed upload route, link route, copy route
Wire everything up in **both** `dev_configuration` and `prod_configuration`, so each request reaches the right handler whatever the rule order.

- `rules/uploads.php`:
  - Replace the `UploadHandler` matcher `['method'=>'POST','uri'=>'/uploads/','type'=>'begins_with']` with `['method'=>'POST','pattern'=>'#^/uploads/(image|file)/\d+/submit$#','type'=>'regex']`.
  - Add a second rule for `LinkHandler` with `['method'=>'POST','pattern'=>'#^/uploads/link/(image|file)/\d+/submit$#','type'=>'regex']`, using the same `host`/`photos_path`/`files_path` as the upload rule.
  - The link rule's `cache_path` is the cache **root** `$cacheFolder`, not the per-domain `$responseCacheLocation`.
- New `rules/staff_copies.php`:
  - `require_once` it in `configure.php` **before** `rules/backend.php`, e.g. right after `delete.php`.
  - Add a `default_proxy` rule matching only `['method'=>'POST','pattern'=>'#^/staff/copies/[a-z0-9_-]+/\d+\.json$#','type'=>'regex']`.
  - Same `host`, `cache` (prod: `"$cacheFolder/" . DomainHash::hash(new Request())`; dev: `$cacheFolder`) and `skip_cache_header` as `backend.php`.
  - `prependMiddlewares`: `ResponseCacheClearMiddleware` with `location => $cacheFolder` and `cross_domain => true`.
  - `middlewares`: `SetClientIpMiddleware` with `$proxySecret`, the same as `backend.php`, because the backend trusts the forwarded client IP.
  - GET routes and `staff/copies/links/<id>/renew.json` don't match the regex and keep going through `backend.php`.
  - Add a header comment explaining why the rule exists: cross-domain invalidation, per `permissions.md#cache`.

## Files to Change
- `proxy/dev_configuration/rules/uploads.php`, `proxy/prod_configuration/rules/uploads.php` — narrowed upload matcher and new link rule.
- `proxy/dev_configuration/rules/staff_copies.php`, `proxy/prod_configuration/rules/staff_copies.php` — new copy rule.
- `proxy/dev_configuration/configure.php`, `proxy/prod_configuration/configure.php` — load `staff_copies.php` before `backend.php`.
- `proxy/extension/tests/configuration/` — new route tests, loading the real rule files like `StaffDeleteRouteTest`:
  - `POST /uploads/image/1/submit` → `UploadHandler`;
  - `POST /uploads/link/image/1/submit` and `POST /uploads/link/file/1/submit` → `LinkHandler`;
  - `POST /uploads/foo/1/submit` and `/uploads/link/foo/1/submit` match neither;
  - `POST /staff/copies/items/3.json` → the copy rule, with its middleware in cross-domain mode;
  - `GET /staff/copies/items.json` and `POST /staff/copies/links/5/renew.json` → `backend.php`.
