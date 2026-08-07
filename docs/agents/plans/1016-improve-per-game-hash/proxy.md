# Proxy Plan: Improve per game hash

Main plan: [plan.md](plan.md)

## Shared contracts

- Removing `$gamesJsonPerDomainCaching` is safe to do unconditionally — it's
  a proxy-only local, and the backend's own removal of `ENABLE_GAMES_PER_DOMAIN`
  is handled independently by the `backend` agent, not something this side
  needs to wait on or call.
- Keep `'skip_cache_header' => 'X-Skip-Cache'` on the `/games.json` handler
  exactly as-is. It's what makes the backend's `X-Skip-Cache: true` response
  (set for any unrecognized `Host`) actually prevent a cache write — the only
  thing now guarding against unbounded `DomainHash`-named folder growth from a
  spoofed `Host`, since the feature flag that used to gate per-domain caching
  is going away.

## Implementation Steps

### Step 1 — Add `DomainHash`

Create `proxy/extension/lib/cache/DomainHash.php`, namespace `Tent\Cache`. A
standalone static helper — deliberately **not** a `RequestHasher`
implementation, since it produces a cache-folder segment, not a cache-key
hash (no `build()`/config needed):

```php
class DomainHash
{
    public static function hash(RequestInterface $request): string
    {
        return 'domain_' . hash('sha256', $request->domain());
    }
}
```

Follow `HostQueryRequestHasher.php`'s existing docblock conventions (explain
why domain-only, why SHA-256, why `"domain_"` prefix) since this class
replaces it directly.

### Step 2 — Remove `HostQueryRequestHasher`

Delete `proxy/extension/lib/cache/HostQueryRequestHasher.php` and its test
`proxy/extension/tests/cache/HostQueryRequestHasherTest.php`. Update
`proxy/extension/loader.php` to require `DomainHash.php` instead of
`HostQueryRequestHasher.php` (currently line 16).

### Step 3 — Rework `games.php`'s cache location and drop the flag

In `proxy/prod_configuration/rules/games.php`:
- Drop the `games_json` path segment. The cache location becomes
  `"$cacheFolder/" . DomainHash::hash($request)` (i.e. `$cacheFolder/domain_<sha256>`),
  computed via `new Request()->domain()`/`DomainHash::hash(...)` the same way
  `docs/tent/host-header.md`-style per-request config evaluation already
  works for this rule file (rules are re-evaluated fresh per request).
- Remove the `if ($gamesJsonPerDomainCaching) { ... }` conditional and its
  `request_hasher` wiring entirely — the `DomainHash`-derived folder path
  applies unconditionally now, no `HostQueryRequestHasher` import needed.
- The same computed location continues to feed both the handler's `cache` key
  and `CacheStalenessMiddleware`'s `location`, exactly as the current
  `$gamesJsonCacheLocation` variable already does for both — no separate
  change needed there beyond updating what the variable is assigned.

### Step 4 — Drop the flag from `locals.php.sample`

Remove `$gamesJsonPerDomainCaching` and its explanatory comment from
`proxy/prod_configuration/locals.php.sample`.

### Step 5 — Update docs

- `docs/agents/cache-warmer.md`: replace the `HostQueryRequestHasher`/
  `$gamesJsonPerDomainCaching` mention with a description of the
  `DomainHash`-named per-domain folder, applying unconditionally (no flag to
  keep in sync with the backend anymore).
- `docs/agents/access-control/game.md`: same — update the paragraph
  describing `$gamesJsonPerDomainCaching`/`ENABLE_GAMES_PER_DOMAIN` mirroring
  to instead describe the unconditional `DomainHash` folder partitioning, and
  drop the "must be kept in sync" language since there's no flag pair left to
  keep in sync.

### Step 6 — Test `DomainHash`

Add `proxy/extension/tests/cache/DomainHashTest.php`, following
`HostQueryRequestHasherTest.php`'s existing pattern (a minimal
`RequestInterface` double — `domain()` support varies across the
`darthjee/tent-test` image this suite runs against, so don't rely on Tent's
own `Request`/`ProcessingRequest`):

- `testHashMatchesExpectedFormat` — `DomainHash::hash($request)` on a
  `game-a.example.com` double equals
  `'domain_' . hash('sha256', 'game-a.example.com')`.
- `testSameDomainHashesIdentically` — same domain, two calls, same result.
- `testDifferentDomainsHashDifferently` — `game-a` vs `game-b` → different
  results.
- `testQueryStringDoesNotAffectHash` — same domain, different `query()` on
  the double → same hash. Explicit contrast with the old hasher: domain-only
  partitioning via the folder (not domain+query mixed into the key) is the
  whole point of this change.

## Files to Change

- `proxy/extension/lib/cache/DomainHash.php` — new class (Step 1)
- `proxy/extension/lib/cache/HostQueryRequestHasher.php` — delete (Step 2)
- `proxy/extension/tests/cache/HostQueryRequestHasherTest.php` — delete (Step 2)
- `proxy/extension/loader.php` — swap the `require_once` (Step 2)
- `proxy/prod_configuration/rules/games.php` — cache path + drop conditional (Step 3)
- `proxy/prod_configuration/locals.php.sample` — drop the flag (Step 4)
- `docs/agents/cache-warmer.md` — update wording (Step 5)
- `docs/agents/access-control/game.md` — update wording (Step 5)
- `proxy/extension/tests/cache/DomainHashTest.php` — new test (Step 6)

## CI Checks

- `proxy`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests`,
  runs `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests`)

## Notes

- No behavioral guard is being added for unbounded cache growth from a
  spoofed `Host` — see the main plan's Shared contracts. Don't drop
  `skip_cache_header` while reworking `games.php`.
