# Wire it into rules/backend.php

In both `proxy/prod_configuration/rules/backend.php` and
`proxy/dev_configuration/rules/backend.php`, add to `prependMiddlewares`:

```php
[
    'class'  => 'Tent\\Middlewares\\BearerSkipCacheMiddleware',
    'header' => 'X-Skip-Cache'
]
```

It must run before `default_proxy`'s built-in `FileCacheMiddleware`, so that the handler's
existing `'skip_cache_header' => 'X-Skip-Cache'` skips both the cache read and the cache write.
Keep `ResponseCacheClearMiddleware` in `prependMiddlewares` and keep `CacheCleanupMiddleware` in
`middlewares`, so Bearer writes still clear stale entries. Update each file's docblock to describe
the new middleware (with a reference to issue #1643).

## Files to Change

- `proxy/prod_configuration/rules/backend.php` — prepend `BearerSkipCacheMiddleware` and update the docblock.
- `proxy/dev_configuration/rules/backend.php` — the same.
