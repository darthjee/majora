# Pass the cache root from the prod rules

In `proxy/prod_configuration/rules/delete.php` and `proxy/prod_configuration/rules/uploads.php`, pass `'cache_path' => $cacheFolder` to `DeleteHandler` / `UploadHandler`. Drop the now-unused `$responseCacheLocation` and the `DomainHash` / `Request` imports if nothing else in the file uses them. Rewrite the rule docblocks: `cache_path` is now the cache root, and paths are cleared across every domain folder (no longer "must match rules/backend.php's domain-scoped cache location"). The dev rules already pass `$cacheFolder`, so only update their docblock wording.

Extend the config tests so the prod rules are checked to wire the cache root, for example by asserting (via reflection, as in the handler build tests) that the matched handler's clearer `root` equals `$cacheFolder` for `DELETE /staff/photos/main/3.json` and `POST /uploads/image/1/submit`, in both dev and prod.

## Files to Change

- `proxy/prod_configuration/rules/delete.php` — pass `$cacheFolder`; update the docblock.
- `proxy/prod_configuration/rules/uploads.php` — pass `$cacheFolder` to `UploadHandler`; update the docblock.
- `proxy/dev_configuration/rules/delete.php` — docblock wording only.
- `proxy/dev_configuration/rules/uploads.php` — docblock wording only.
- `proxy/extension/tests/configuration/StaffDeleteRouteTest.php` — assert the cache root is wired (dev and prod).
- `proxy/extension/tests/configuration/CopyRoutesTest.php` — assert the cache root is wired for `UploadHandler` (dev and prod).
