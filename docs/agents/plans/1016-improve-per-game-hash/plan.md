# Plan: Improve per game hash

Issue: [1016-improve-per-game-hash.md](../issues/1016-improve-per-game-hash.md)

## Overview

Replace `HostQueryRequestHasher`'s domain+query cache-key mixing for `/games.json`
with a dedicated `DomainHash` class that names a per-domain cache **folder**
(`domain_<sha256>`) instead, dropping the `games_json` path segment. Remove the
now-permanent `$gamesJsonPerDomainCaching` (proxy) and `ENABLE_GAMES_PER_DOMAIN`
(backend) feature flags entirely, since per-domain games splitting already runs
unconditionally in production — collapsing both sides down to their "on" branch
and deleting the "off" branch, its tests, and the flag itself.

## Agents involved

- [proxy](proxy.md)
- [backend](backend.md)

## Shared contracts

- **No runtime coupling, but a coordinated removal.** `$gamesJsonPerDomainCaching`
  and `ENABLE_GAMES_PER_DOMAIN` don't call into each other in code — the proxy
  never queries the backend setting or vice versa — but both are removed
  together in this same issue since they represent one decision ("per-domain
  is now permanent"), not two independent ones. No transient mixed-state
  deploy handling is needed.
- **Unbounded-cache-growth safety net (must be preserved, not built new).**
  The backend already returns 404 + `X-Skip-Cache: true` for any `Host` not in
  `RegisteredDomainsCache.domains()` (`backend/games/views/games/games_list.py`).
  The proxy's `games.php` handler already declares
  `'skip_cache_header' => 'X-Skip-Cache'`, which is what makes that header
  actually stop the response from being cached. Removing the feature flags
  must not touch this: it's the only thing standing between an arbitrary
  spoofed `Host` and an unbounded number of new `DomainHash`-named cache
  folders, now that the flag is no longer a second line of defense. Both
  agents should leave this wiring untouched while editing the surrounding
  code.

## CI Checks

- `proxy`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests`,
  runs `vendor/bin/phpunit --bootstrap .../tests/bootstrap.php .../tests`)
- `backend`: `poetry run pytest games/tests/views/` from `backend/` (CI job:
  `pytest_views_rest`, excludes `games/tests/views/game/`, which covers
  `games/tests/views/games/games_list_test.py`)

## Notes

- No new API surface, endpoint, or serializer field is introduced — this is
  internal caching/config plumbing only.
- The backend change has a non-obvious test-breaking consequence: see
  [backend.md](backend.md)'s Notes for `TestGamesListView`/`TestGamesCreateView`.
