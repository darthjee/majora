# Issue: Use game by domain

## Description
Behind a new env-driven flag, `ENABLE_GAMES_PER_DOMAIN`, restrict `/games.json` (both listing and creation) to the games reachable from the requesting domain.

This builds on prior work: `#942` added `GameDomainGroup`/`GameDomain` (the foundational per-domain data model), `#963` added `DomainGamesCache.game_ids_for_request(request)` — a cached lookup from a request's hostname to the game ids reachable under it — and `#966` made `GameDomain.domain` globally unique and turned `Game`'s link to `GameDomainGroup` into a many-to-many (`game_domain_groups`). `DomainGamesCache` was built but never wired into a view. This issue is that wiring.

## Problem
- `DomainGamesCache` exists but is not consumed anywhere yet, so `/games.json` always lists every `Game` regardless of domain.
- The cache alone can't distinguish an **unrecognized** domain from a **recognized domain with zero games** — both resolve to an empty id list by design (to avoid repeated lookups for bad hosts) — so a separate existence check is needed to return `404` only for the former.
- Domain resolution is currently latently broken for real traffic: the app sits behind the `darthjee/tent` proxy (`proxy/prod_configuration/rules/backend.php`, `default_proxy` handler), which renames the original `Host` header to `X-Forwarded-Host` and overwrites `Host` with the upstream's own internal hostname before forwarding to Django (see `docs/agents/external/tent/host-header.md`). `DomainGamesCache.game_ids_for_request` currently reads `request.get_host()`, which as written would resolve to the internal service hostname, never the real domain the browser hit.

## Expected Behavior
- **Flag off (default)** — `/games.json` behaves exactly as today, unaffected by domain.
- **Flag on, `GET`, recognized domain** — returns only the games attached (via `GameDomainGroup`) to that domain, with pagination applied on top of the filtered set.
- **Flag on, `GET`, recognized domain with zero games** — returns `200` with an empty page (not `404`).
- **Flag on, `GET`/`POST`, unrecognized domain** — returns `404`.
- **Flag on, `POST`, recognized domain** — the newly created game is attached to that domain's `GameDomainGroup`, so it doesn't silently disappear from the list that just created it.
- **Flag on, `POST`, unrecognized domain** — `404`; no game is created.
- Only `/games.json` (`GET`+`POST`) is in scope. No nested/detail endpoint gets a domain restriction in this issue — a game not listed under a domain stays reachable directly if its id/URL is already known; locking that down is left for a future issue.

## Solution
- **Env flag**: new Django setting `ENABLE_GAMES_PER_DOMAIN` in `backend/majora_project/settings.py`, read via the existing boolean-env-var pattern (`os.environ.get('X', 'false').lower() == 'true'`), defaulting to `false`.
- **Proxy-safe domain resolution**: set `USE_X_FORWARDED_HOST = True` in settings, so Django's `request.get_host()` (already used by `DomainGamesCache`) automatically prefers `X-Forwarded-Host` when present — no code change needed in `DomainGamesCache`. Safe because Tent's `RenameHeaderMiddleware` (part of `default_proxy`) always overwrites `X-Forwarded-Host` with whatever `Host` it actually received; a client cannot smuggle a spoofed value past Tent to the backend.
- **New `RegisteredDomainsCache`** (alongside `DomainGamesCache` in `games/caches/`): a single cache entry (e.g. `CACHE_TYPE = 'registered_domains'`) holding the lowercased set of every `GameDomain.domain`. Consistent with this codebase's existing `memory_cache` pattern, which only supports whole-cache invalidation (staff-only `DELETE` clears everything) — a single set entry fits that model with no new invalidation burden.
- **View flow** in `backend/games/views/games/games_list.py`: resolve the request's host; when the flag is on, `404` if `host not in RegisteredDomainsCache.domains()`; otherwise filter via `Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))` before pagination (avoids re-deriving the domain → group → games join per request — the whole point of the cache from `#963`), and on `POST`, attach the created game to `GameDomain.objects.get(domain=host).game_domain_group`.
- **Tests**: flag on/off, recognized domain with/without games, unrecognized domain (`GET` and `POST`), pagination scoped to the domain, `POST`-time attachment, domain resolution via `X-Forwarded-Host` (simulating the proxy), and `RegisteredDomainsCache` unit tests analogous to the existing `domain_games_cache_test.py`.

## Benefits
- Unlocks the multi-tenant/white-label groundwork laid by `#942`, `#963`, and `#966` — different domains can finally show different game sets.
- Fixes a latent bug where domain resolution would have silently failed in production behind the Tent proxy.
- Keeps newly-created games visible on the domain that created them, avoiding a confusing disappearing-game experience for domain-scoped hosts.
