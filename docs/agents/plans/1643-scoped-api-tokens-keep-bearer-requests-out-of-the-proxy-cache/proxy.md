# Proxy Plan: Scoped API tokens: keep Bearer requests out of the proxy cache

Main plan: [plan.md](plan.md)

## Shared contracts

- Bearer detection: the whole `Authorization` value (several headers joined with `,`) matches
  `/(^|,)\s*bearer(\s|$)/i`. It must stay identical to the backend's
  `accounts.authentication.BEARER_PATTERN`.
- On a Bearer request, the middleware sets the configured marker header to `true`:
  `X-Skip-Cache` on `rules/backend.php` and `X-Bearer-Request` on
  `rules/private_game_data_cache.php`.
- Inbound marker headers are never stripped.
- The backend independently adds `X-Skip-Cache: true` and `Cache-Control: no-store` to every
  Bearer response. Tent's `skip_cache_header` checks the request **or** the response, so on
  `backend.php` this is a second guard on the write path.

## Steps

- [01 — Add BearerSkipCacheMiddleware](proxy/01-add-bearer-skip-cache-middleware.md)
- [02 — Wire it into rules/backend.php](proxy/02-wire-backend-rule.md)
- [03 — Wire it into rules/private_game_data_cache.php](proxy/03-wire-private-rule.md)
- [04 — Rule-level cache tests](proxy/04-rule-level-cache-tests.md)

## CI Checks

- `proxy/`: `docker-compose run --rm proxy_tests` plus the PHP lint step in
  `.claude/scripts/check_proxy.sh` (CI job: `proxy_extension_tests`)

## Notes

- Tent matchers cannot select a rule by header, which is why a marker plus `skip_cache_header` is
  used (see the rejected options in `token-api.md`).
- `CacheCleanupMiddleware` and `ResponseCacheClearMiddleware` must keep running on Bearer writes.
  Adding the new middleware must not remove or reorder them in a way that skips them.
- The middleware must go in **both** `prod_configuration` and `dev_configuration`. The two
  `backend.php` files differ (the dev file uses a hardcoded host and `$cacheFolder`), so edit each
  file in place rather than copying one over the other.
- The private rule's routes always send `X-Skip-Cache: true` on the response, so that rule must
  not honour `X-Skip-Cache`. Its marker is `X-Bearer-Request`.
