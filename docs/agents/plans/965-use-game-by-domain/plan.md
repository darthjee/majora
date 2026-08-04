# Plan: Use game by domain

Issue: [965-use-game-by-domain.md](../../issues/965-use-game-by-domain.md)

## Overview

Wire the existing (but unused) `DomainGamesCache` (`#963`) into `/games.json`, behind a new
`ENABLE_GAMES_PER_DOMAIN` setting: when on, `GET` lists only the games reachable from the
requesting domain and `POST` auto-attaches the created game to that domain's
`GameDomainGroup`. An unrecognized domain returns `404`. Also fixes domain resolution behind
the `darthjee/tent` proxy, and prevents Tent's file cache from serving one domain's
`/games.json` response to another.

This is entirely backend work — no proxy, frontend, or cache-warmer changes are needed (see
"Proxy cache correctness" below for why).

## Context

- `#942` added `GameDomainGroup` / `GameDomain`. `#963` added
  `DomainGamesCache.game_ids_for_request(request)` (a cached hostname → game-ids lookup) but
  left it unwired. `#966` made `GameDomain.domain` globally unique and turned `Game`'s link to
  `GameDomainGroup` into a many-to-many (`game_domain_groups`).
- `backend/games/views/games/games_list.py` currently does `Game.objects.all()` for `GET` and
  creates games unconditionally for `POST`, with no domain awareness at all.
- **Proxy header rewrite**: the app sits behind `darthjee/tent` (`default_proxy` handler, see
  `docs/agents/external/tent/host-header.md`). It renames the original `Host` header to
  `X-Forwarded-Host` and overwrites `Host` with the backend's internal service hostname before
  forwarding. `DomainGamesCache.game_ids_for_request` reads `request.get_host()`, which as
  written today resolves to the internal hostname, never the real domain — this is a real bug,
  not yet exercised because nothing calls it. Fix: set `USE_X_FORWARDED_HOST = True` in Django
  settings so `get_host()` transparently prefers `X-Forwarded-Host`. This is safe because Tent's
  `RenameHeaderMiddleware` always overwrites `X-Forwarded-Host` with whatever `Host` it actually
  received — a client cannot smuggle a spoofed value past Tent to the backend.
- **Proxy cache correctness** (new finding from this planning pass, not previously discussed):
  Tent's `FileCacheMiddleware` (enabled by default under `default_proxy`, see
  `docs/agents/external/tent/cache-configuration.md`) keys its cache purely off the request's
  query string — it does **not** vary by `Host`/`X-Forwarded-Host`. Once `/games.json`'s body
  starts varying per domain, that proxy-level cache would serve one domain's cached response to
  every other domain hitting the same path, until the cache entry expires/clears. The existing,
  established fix for this class of problem in this codebase is `response['X-Skip-Cache'] =
  'true'` (see `backend/games/views/common.py::access_response`, and the `skip_cache_header`:
  `'X-Skip-Cache'` option already wired into both `proxy/{dev,prod}_configuration/rules/backend.php`).
  So: when `ENABLE_GAMES_PER_DOMAIN` is on, `/games.json` responses (`GET` and `POST`) must set
  `X-Skip-Cache: true` — no proxy config changes needed, this is a pure backend-side response
  header. When the flag is off, no header is set and default proxy caching is unaffected
  (matches today's behavior).
- `RegisteredDomainsCache` is a new cache needed alongside `DomainGamesCache`: the latter caches
  an unrecognized hostname and a recognized-but-empty `GameDomain` identically (both an empty id
  list, by design — see its docstring), so a separate existence check is required to return
  `404` only for a genuinely unrecognized domain.

## Implementation Steps

### Step 1 — Env flag and proxy-safe host resolution

In `backend/majora_project/settings.py`:
- Add `ENABLE_GAMES_PER_DOMAIN = os.environ.get('ENABLE_GAMES_PER_DOMAIN', 'false').lower() == 'true'`,
  next to the other boolean env settings.
- Add `USE_X_FORWARDED_HOST = True`.

### Step 2 — `RegisteredDomainsCache`

Add `backend/games/caches/registered_domains_cache.py`, following `DomainGamesCache`'s shape
(same `majora_project.cache.memory_cache` plumbing, lazy model import to avoid the same circular
import noted in `DomainGamesCache._query`):

```python
class RegisteredDomainsCache:
    CACHE_TYPE = 'registered_domains'
    _KEY = 'all'

    @classmethod
    def domains(cls):
        """Return the cached (or freshly computed) set of every registered GameDomain.domain."""
        cached = memory_cache.get(cls.CACHE_TYPE, cls._KEY)
        if cached is not None:
            return cached
        result = cls._query()
        memory_cache.set(cls.CACHE_TYPE, cls._KEY, result, sys.getsizeof(result))
        return result

    @classmethod
    def _query(cls):
        from games.models.game.game_domain import GameDomain
        return set(GameDomain.objects.values_list('domain', flat=True))
```

Register it in `backend/games/caches/__init__.py` (`__all__` too), matching the existing list.

### Step 3 — Wire `/games.json`

In `backend/games/views/games/games_list.py`:
- When `settings.ENABLE_GAMES_PER_DOMAIN` is `True`:
  - Resolve `host = request.get_host().split(':')[0].lower()` (mirrors
    `DomainGamesCache.game_ids_for_request`'s own normalization).
  - If `host not in RegisteredDomainsCache.domains()`: return a `404` `Response` (with
    `X-Skip-Cache: true` set — an unrecognized domain is still a domain-dependent response).
  - Otherwise:
    - `GET`: filter `Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))`
      before pagination (`paginated_list_response`), instead of `Game.objects.all()`. Set
      `X-Skip-Cache: true` on the response.
    - `POST`: after `serializer.save()`, resolve
      `GameDomain.objects.get(domain=host).game_domain_group` and call
      `game.game_domain_groups.add(that_group)` before building the `GameDetailSerializer`
      response. Set `X-Skip-Cache: true` on the response.
- When the flag is `False`: behavior is unchanged from today (`Game.objects.all()`, no header).

Keep the view thin per this repo's convention (`AGENTS.md` — "business logic belongs in models
or serializers") — if the domain-resolution/attachment logic grows beyond a few lines, consider
a small helper in `games/views/games/` rather than inlining it all in `games_list`, but do not
over-engineer for a single call site.

### Step 4 — Tests

- `backend/games/tests/caches/registered_domains_cache_test.py` — mirror
  `domain_games_cache_test.py`'s shape: miss computes + caches, hit serves cached (even after the
  underlying `GameDomain` changes), case-insensitivity if applicable, cleared by
  `memory_cache.clear()` / the `staff_cache_clear` endpoint.
- Extend `backend/games/tests/views/games/games_list_test.py` (or a new file if it grows large)
  with, all under `@override_settings(ENABLE_GAMES_PER_DOMAIN=True)` unless noted:
  1. Flag off (default, no override) — `GET` still returns all games, no `X-Skip-Cache` header.
  2. Flag on, recognized domain with games (`HTTP_HOST` set to a domain from a `GameDomainFactory`
     whose group has games) — `GET` returns only those games; pagination reflects the filtered
     count, not the global one.
  3. Flag on, recognized domain, zero games in its group — `GET` returns `200` with an empty list.
  4. Flag on, unrecognized domain — `GET` returns `404`.
  5. Flag on, `POST` on a recognized domain — the created game's `game_domain_groups` includes
     that domain's group.
  6. Flag on, `POST` on an unrecognized domain — `404`; no `Game` row is created.
  7. Flag on, any successful `GET`/`POST` — response has `X-Skip-Cache: true`.
  8. Domain resolved via `X-Forwarded-Host`, not `Host` — simulate the proxy with
     `HTTP_X_FORWARDED_HOST` set to the real domain and `HTTP_HOST` set to something else (e.g.
     the backend service name), relying on `USE_X_FORWARDED_HOST = True` from Step 1.

## Files to Change

- `backend/majora_project/settings.py` — add `ENABLE_GAMES_PER_DOMAIN`, `USE_X_FORWARDED_HOST`.
- `backend/games/caches/registered_domains_cache.py` — new.
- `backend/games/caches/__init__.py` — register `RegisteredDomainsCache`.
- `backend/games/views/games/games_list.py` — domain filtering (`GET`), auto-attach + 404
  handling (`POST`), `X-Skip-Cache` header.
- `backend/games/tests/caches/registered_domains_cache_test.py` — new.
- `backend/games/tests/views/games/games_list_test.py` — extended coverage per Step 4.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) — covers the `games_list_test.py` changes.
- `backend`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers the new `registered_domains_cache_test.py`.
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`).

## Notes

- The proxy-cache-correctness issue (Tent's file cache not varying by domain) was not discussed
  during `enhance-issue`/`discuss-issue` — it surfaced during this planning pass. Resolved via
  `X-Skip-Cache`, an existing backend-owned mechanism, so no `proxy`/`infra` agent involvement is
  needed for this issue.
- Navi (`navi/resources/games.yml`) currently warms `/games.json` against a single production
  URL with no per-domain awareness. Since `X-Skip-Cache` makes this endpoint fully bypass Tent's
  file cache whenever the flag is on, warming isn't relevant to it in that state anyway — no
  change needed here, and multi-domain warming (if ever wanted for some other cached endpoint)
  is out of scope.
- No migration is needed — no model/field changes, only settings, a new cache class, and view
  logic.
- Per the issue, only `/games.json` (`GET`+`POST`) is in scope; no nested/detail endpoint gets a
  domain restriction here.
