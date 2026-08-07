# Issue: Improve per game hash

## Description

In PR #1013 (issue #1011, commit `b2e9d118`), `HostQueryRequestHasher`
(`proxy/extension/lib/cache/HostQueryRequestHasher.php`) was introduced to
partition `/games.json`'s cache by domain — mixing the request's domain and
query string into the cache-key hash so multiple domains could share one
physical cache folder without colliding.

This issue replaces that approach: instead of blending the domain into the
cache-key hash, partition by giving each domain its own cache folder, named
from a SHA-256 hash of the domain. A new dedicated class, `DomainHash`,
computes that folder name from the request. `HostQueryRequestHasher` is
removed entirely, along with the per-domain-caching feature flags
(`$gamesJsonPerDomainCaching` in the proxy, `ENABLE_GAMES_PER_DOMAIN` in the
backend) — per-domain games splitting is already running in production, so
the flags no longer earn their keep.

## Problem

- `HostQueryRequestHasher` mixes the domain into the cache-key hash rather
  than into the filesystem layout, entangling domain partitioning with
  cache-key computation and making the cache directory structure opaque
  (one flat folder holding every domain's entries, distinguishable only by
  hash).
- `$gamesJsonPerDomainCaching` (proxy) and `ENABLE_GAMES_PER_DOMAIN`
  (backend) still gate this behavior behind a flag/env var and a matching
  `if`-branch + test variants on both sides, even though per-domain games
  splitting is already the permanent, live behavior in production — the
  flags are dead weight at this point.

## Solution

- **New class**: `Tent\Cache\DomainHash` (`proxy/extension/lib/cache/DomainHash.php`),
  a standalone static helper — not a `RequestHasher` implementation, since it
  builds a cache-folder segment rather than a cache-key hash. It takes a
  `RequestInterface $request`, reads `$request->domain()`, and returns
  `"domain_" . hash('sha256', $domain)` via a static
  `DomainHash::hash(RequestInterface $request): string` method (no
  `build()`/config needed, unlike `RequestHasher` implementations).

- **Remove `HostQueryRequestHasher`**: delete the class
  (`proxy/extension/lib/cache/HostQueryRequestHasher.php`) and its test
  (`proxy/extension/tests/cache/HostQueryRequestHasherTest.php`), drop the
  `request_hasher` wiring it added to `games.php`, and update the docs that
  currently describe it (`docs/agents/cache-warmer.md`,
  `docs/agents/access-control/game.md`) to reflect the folder-based approach
  instead.

- **Cache path**: drop the `games_json` segment entirely. The cache location
  in `proxy/prod_configuration/rules/games.php` becomes
  `"$cacheFolder/" . DomainHash::hash($request)` (i.e. `$cacheFolder/domain_<sha256>`),
  not `$cacheFolder/games_json/domain_<hash>`. Since `games.php` is a rule
  file re-evaluated fresh per request (like any Tent config file — see
  `Tent\Models\Request::domain()`), this same computed location naturally
  flows into both the handler's `cache` key and `CacheStalenessMiddleware`'s
  `location`, the same way the current `$gamesJsonCacheLocation` variable
  already feeds both — no separate change needed there.

- **Remove the feature flag entirely, on both sides** — per-domain games
  splitting is already working in production:
  - Proxy: drop `$gamesJsonPerDomainCaching` from `locals.php.sample` and its
    conditional in `games.php` — the folder-based `DomainHash` path applies
    unconditionally now.
  - Backend: remove `ENABLE_GAMES_PER_DOMAIN` from
    `backend/majora_project/settings.py`; `games_list.py`'s `games_list()`
    always takes the `_games_list_per_domain()` path (the flat/unscoped
    branch and the `if not settings.ENABLE_GAMES_PER_DOMAIN` check go away —
    `_games_list_per_domain` likely folds back into `games_list` directly at
    that point).
  - Tests: drop the `@override_settings(ENABLE_GAMES_PER_DOMAIN=True, ...)`
    decorators in `games_list_test.py` (becomes the only behavior, not a
    variant) and remove the "left at its default (off)" test class for the
    flat-listing path it exercised.
  - Docs: update `docs/agents/cache-warmer.md` and
    `docs/agents/access-control/game.md`, which currently describe
    `ENABLE_GAMES_PER_DOMAIN`/`$gamesJsonPerDomainCaching` as togglable.
  - This is a deliberate scope expansion beyond the original proxy-only ask,
    kept in this same issue rather than split out, since both sides are
    driven by the same "per-domain is now permanent" decision.

- **Unbounded cache growth from spoofed `Host`**: no extra guard needed. The
  backend already 404s (and sets `X-Skip-Cache: true`) for any `Host` not in
  `RegisteredDomainsCache.domains()` (`games_list.py`), and every `games.php`
  handler already honors `skip_cache_header => X-Skip-Cache` — the
  project-wide convention documented in
  `docs/agents/access-control/principles.md`'s "`X-Skip-Cache` rule". A
  request for an unregistered domain is therefore never written to disk in
  the first place: no `DomainHash`-derived folder gets created for it,
  regardless of how many distinct spoofed `Host` values a client sends. Only
  genuinely registered domains — a bounded, admin-controlled set — ever get
  a cache folder. This was true before this change too; it's just now the
  sole safety net, since the `$gamesJsonPerDomainCaching` flag (removed
  above) is no longer there as a second line of defense.

- **`DomainHash` test coverage**: `proxy/extension/tests/cache/DomainHashTest.php`,
  following `HostQueryRequestHasherTest.php`'s existing pattern (a minimal
  `RequestInterface` double, since `domain()` support varies across the
  `darthjee/tent-test` image this suite runs against):
  - `testHashMatchesExpectedFormat` — `DomainHash::hash($request)` on a
    `game-a.example.com` double equals
    `'domain_' . hash('sha256', 'game-a.example.com')`.
  - `testSameDomainHashesIdentically` — same domain, two calls, same result.
  - `testDifferentDomainsHashDifferently` — `game-a` vs `game-b` → different
    results.
  - `testQueryStringDoesNotAffectHash` — same domain, different `query()` on
    the double → same hash. Explicit contrast with the old hasher, since
    domain-only partitioning (via the folder) instead of domain+query mixed
    into the key is the whole point of this change.

## Benefits

- Domain partitioning lives where it belongs — the filesystem layout — instead
  of being folded into the cache-key hash, making the cache directory
  structure legible (one folder per domain) rather than a flat pile of hashes.
- Removes dead/unused code (`HostQueryRequestHasher`) and two feature flags
  that no longer reflect an actual on/off decision, on both the proxy and the
  backend, along with the test variants and docs that existed only to
  describe them.
- `DomainHash` is a small, independently testable unit with a single
  responsibility, easier to reason about than the combined domain+query
  hasher it replaces.
- No security regression: the existing `X-Skip-Cache` convention already
  prevents unrecognized/spoofed domains from ever writing a cache entry,
  so removing the feature flag doesn't reopen the unbounded-cache-growth
  concern it was originally guarding against.
