# Wire it into rules/private_game_data_cache.php

In both `proxy/prod_configuration/rules/private_game_data_cache.php` and
`proxy/dev_configuration/rules/private_game_data_cache.php`:

- Add `'skip_cache_header' => 'X-Bearer-Request'` to the handler.
- Add a `prependMiddlewares` entry:

  ```php
  [
      'class'           => 'Tent\\Middlewares\\BearerSkipCacheMiddleware',
      'header'          => 'X-Bearer-Request',
      'skipWhenMissing' => 'X-Cache-Token'
  ]
  ```

  This skips the cache for Bearer requests and for any request without a non-empty
  `X-Cache-Token`, so the shared "empty token" entry can no longer be written or served.
- Rewrite the docblock paragraph "Deliberately has no `skip_cache_header` option". It should now
  say that the rule does not honour `X-Skip-Cache` (its routes always send it), uses
  `X-Bearer-Request` instead, and refuses to cache without `X-Cache-Token` (issue #1643).

`PrivateRequestHasher` stays as it is. Its empty-string fallback for a missing header becomes
unreachable for cached traffic on this rule, so don't update its docblock unless the wording
becomes misleading.

## Files to Change

- `proxy/prod_configuration/rules/private_game_data_cache.php` — add the skip header, the prepended middleware and the docblock change.
- `proxy/dev_configuration/rules/private_game_data_cache.php` — the same.
