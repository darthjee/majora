# Switch handlers to cross-domain clearing

In `DeleteHandler` and `UploadHandler`, build the clearer with `ResponseCacheClearer::forRoot($cacheRoot)` instead of `forPath($cachePath)`. Rename the constructor parameter to `$cacheRoot` and update its doc comment ("Cache root cleared across every domain folder ('' disables clearing)"), mirroring `LinkHandler`. `build()` still reads `'cache_path'`, which now means the cache root. Keep the `clearFrom()` call sites and the `withoutHeader()` stripping unchanged.

Tests:

- Add a test to each handler that mirrors `LinkHandlerTest::testFinalizeClearsCacheAcrossDomains`. Seed the same path in the root and in two `domain_<sha256>` folders, then assert a successful staff delete/finalize clears all three and leaves an unlisted path untouched.
- Add a test asserting that a successful response without `X-Cache-Clear` (the regular character photo delete / regular upload case) clears nothing in any domain folder.
- `UploadHandlerTest::testBuildPassesCachePathToClearer` reads the clearer's `location`, which is null in cross-domain mode. Change it to assert the `root` property instead, and add the same `build()` assertion for `DeleteHandler` if none exists.
- The existing flat-folder tests (`testDeleteXCacheClearClearsPathsAndIsStripped`, `testFinalizeXCacheClearClearsPathsAndIsNotForwarded`, the failed/non-2xx and client-header tests) should keep passing as-is, because `forRoot()` also clears the root.

## Files to Change

- `proxy/extension/lib/handlers/DeleteHandler.php` — use `forRoot()`; rename the param and update its docs.
- `proxy/extension/lib/handlers/UploadHandler.php` — use `forRoot()`; rename the param and update its docs.
- `proxy/extension/tests/handlers/DeleteHandlerTest.php` — cross-domain and no-header tests.
- `proxy/extension/tests/handlers/UploadHandlerTest.php` — cross-domain and no-header tests; fix `testBuildPassesCachePathToClearer`.
