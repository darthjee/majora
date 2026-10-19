# Rule-level cache tests

Load the real prod and dev rule files the same way
`proxy/extension/tests/configuration/BackendRuleCacheClearTest.php` does: a temporary copy of each
rule file, a temporary `$cacheFolder` and a mocked HTTP client. Then assert end to end:

- **`backend.php` (prod and dev):**
  - A Bearer `.json` GET is never written to the cache. A cached entry primed by a plain GET is not
    served to a later Bearer GET (the backend is called again).
  - A Bearer POST/PATCH/DELETE still runs `CacheCleanupMiddleware` (the collection/entity entry is
    cleared) and `ResponseCacheClearMiddleware` (`X-Cache-Clear` paths are cleared).
  - `Token` and cookie GETs are still cached as before.
  - A forged `X-Skip-Cache` / `X-Bearer-Request` on a non-Bearer request skips only that request's
    own cache use. An entry primed by another caller stays intact and is still served to the
    other caller.
- **`private_game_data_cache.php` (prod and dev):**
  - A Bearer GET with an `X-Cache-Token` is neither served from nor written to the cache.
  - A GET without `X-Cache-Token` (or with an empty one) is never stored, and a later anonymous GET
    never receives a response cached for it.
  - A GET with a `Token` header and an `X-Cache-Token` is still cached per token, as before.

Add new test classes (for example `BackendRuleBearerCacheTest.php` and
`PrivateRuleBearerCacheTest.php`) instead of growing the existing ones.

## Files to Change

- `proxy/extension/tests/configuration/BackendRuleBearerCacheTest.php` — new.
- `proxy/extension/tests/configuration/PrivateRuleBearerCacheTest.php` — new.
