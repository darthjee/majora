# Issue: Add fetch game_ids by domain

## Description
We need a class that, given a request, resolves all `Game`s that belong to the `GameDomain` matching that request's hostname. Internally it uses the shared in-process `memory_cache` to cache, per web domain, which game ids are available — avoiding a repeated DB lookup on every request once it's eventually wired in. This class is prep only: it is not consumed by any view or middleware in this issue.

Separately, since two `GameDomain` rows may legitimately share the same web domain string as long as they belong to different `GameDomainGroup`s, the current global uniqueness on `GameDomain.domain` needs to become unique per `GameDomainGroup` instead.

## Problem
`Game` is reachable only through `GameDomainGroup` (added in #942), and `GameDomain.domain` is currently globally unique. There is no reusable, cached way to go from "the hostname a request came in on" to "the game ids available under that host," and the current global uniqueness on `domain` blocks two different `GameDomainGroup`s (tenants/brands) from ever sharing the same hostname, which the domain-per-group design should allow.

## Expected Behavior
- `DomainGamesCache.game_ids_for_domain('example.com')` returns the list of `Game` ids whose `game_domain_group` matches the `GameDomain` row for `example.com` (case-insensitive, port-insensitive), computing and caching on a miss and serving from `memory_cache` on subsequent calls.
- `DomainGamesCache.game_ids_for_request(request)` derives the hostname from `request.get_host()` (port stripped) and delegates to `game_ids_for_domain`.
- An unrecognized hostname resolves to (and caches) an empty id list rather than raising.
- Two `GameDomain` rows may store the same `domain` value as long as they belong to different `GameDomainGroup`s; creating a second `GameDomain` with the same `domain` in the *same* `GameDomainGroup` is rejected by a DB-level constraint.
- This class is not yet called from any view, middleware, or serializer — that wiring is deferred to a future issue.

## Solution

### Cache Key & Value
- **Lookup chain**: `Game` has a direct FK to `GameDomainGroup` (not to `GameDomain`), so resolving games for a request is: request → hostname → `GameDomain.objects.get(domain=hostname)` → its `game_domain_group` → `Game.objects.filter(game_domain_group=that_group)` ids. The new class caches the result of that last step.
- **Key source**: derived from `request.get_host()` with any port stripped (split on `:`), since `GameDomain.domain` is validated as a bare hostname with no port.
- **Case handling**: the incoming host is lowercased before being used as the cache key/lookup value, and compared against `GameDomain.domain` case-insensitively, since hostnames are case-insensitive but `domain` isn't currently forced lowercase on save.
- **Cache type/namespace**: entry type `domain_games` (matching the existing `games/caches/*` wrappers' `CACHE_TYPE` convention, e.g. `game_player`, `admin_or_staff`), so this cache's keys are partitioned separately from other `memory_cache` consumers. Key within that type is the normalized hostname.
- **Value**: a plain list of `Game` ids for the resolved `GameDomainGroup`.
- **Unknown domain**: a hostname that matches no `GameDomain` at all is still cached, as an empty id list — same treatment as a known domain with zero games. Avoids repeated DB lookups for bad/unknown hosts.
- This class does not reuse `_BooleanCheckCache` (kept boolean-only, as currently named/documented); it writes its own `memory_cache.get`/`memory_cache.set` calls directly, following the same shape as `games/caches/boolean_check_cache.py`'s `_get_or_compute` but without the boolean framing.

### Class API & Entry Point
- **Location/name**: `games/caches/domain_games_cache.py` → `DomainGamesCache`, alongside `AdminOrStaffCache`/`GamePlayerCache`/`CharacterEditorCache` in `games/caches/`, registered in `games/caches/__init__.py`'s `__all__` the same way.
- **Two entry points**:
  - A core classmethod taking a plain hostname string (`game_ids_for_domain(cls, domain)`), doing the lowercasing/lookup/cache-or-compute described above — request-agnostic, easy to unit test directly.
  - A thin wrapper classmethod taking the Django `request` (`game_ids_for_request(cls, request)`) that extracts the host via `request.get_host()`, strips the port, and delegates to `game_ids_for_domain`.
- **Return value**: a plain list of `Game` ids (`list(Game.objects.filter(...).values_list('id', flat=True))`) — not a QuerySet, since the result must be cacheable as-is.
- Not wired into any view/middleware yet — this issue is prep only.

### GameDomain Uniqueness Constraint Change
- Today `GameDomain.domain` is globally `unique=True`. This changes to unique **per `GameDomainGroup`**: two `GameDomain` rows may share the same `domain` string as long as they belong to different `GameDomainGroup`s, but not within the same group.
- **Model change**: drop the field-level `unique=True` from `domain`, add `models.UniqueConstraint(fields=['domain', 'game_domain_group'], name='unique_domain_per_group')` to `GameDomain.Meta.constraints` — matching the style already used in `Character.Meta.constraints` (`backend/games/models/character/character.py`).
- **Case normalization**: `domain` is normalized to lowercase on save (e.g. via an overridden `save()`), so storage, the DB-level uniqueness constraint, and the cache's case-insensitive key matching agree on the same notion of domain identity.
- Requires a new migration (drop the unique index on `domain`, add the composite `UniqueConstraint`), following the same migration pair pattern used by issue #942's `...gamedomaingroup_gamedomain_game_game_domain_group.py` migration.

## Benefits
- Lays the groundwork for cheap, cached per-request domain-to-games resolution, ready to be wired into views/middleware in a follow-up issue without a redesign.
- Correctly supports multiple tenants/brands (`GameDomainGroup`s) sharing the same hostname string when needed, matching the domain-per-group model introduced in #942.
- Keeps domain identity consistent (case, uniqueness scope) across storage, DB constraints, and cache lookups, avoiding subtle cache/DB divergence bugs.
