# Plan: Add fetch game_ids by domain

Issue: [963-add-fetch-game-ids-by-domain.md](../../issues/963-add-fetch-game-ids-by-domain.md)

## Overview

Add a `DomainGamesCache` class that resolves and caches, per request hostname, the list of `Game` ids reachable through that host's `GameDomain`/`GameDomainGroup`. This is prep work only — nothing calls it yet. Alongside it, relax `GameDomain.domain` from globally unique to unique per `GameDomainGroup`, normalizing stored/queried domains to lowercase so the DB constraint and the new cache's lookups agree on domain identity.

## Context

`Game` has a direct FK to `GameDomainGroup` (added in #942), not to `GameDomain`. `GameDomain.domain` is currently `unique=True` globally (`backend/games/models/game/game_domain.py`). The shared process-wide `memory_cache` (`backend/majora_project/cache/`) already backs three boolean permission caches under `backend/games/caches/` (`AdminOrStaffCache`, `GamePlayerCache`, `CharacterEditorCache`), all built on `_BooleanCheckCache`'s `_get_or_compute(entry_type, key, compute)` helper (`backend/games/caches/boolean_check_cache.py`). That helper isn't reusable here since it's documented/named as boolean-only and this cache stores an id list, so the new class implements its own `memory_cache.get`/`memory_cache.set` calls in the same shape.

## Implementation Steps

### Step 1 — Relax `GameDomain.domain` uniqueness to per-group, with lowercase normalization

In `backend/games/models/game/game_domain.py`:
- Remove `unique=True` from the `domain` field.
- Add `class Meta: constraints = [models.UniqueConstraint(fields=['domain', 'game_domain_group'], name='unique_domain_per_group')]` — same pattern as `Character.Meta.constraints` in `backend/games/models/character/character.py`.
- Override `save()` to lowercase `self.domain` before calling `super().save(...)`, so stored values, the uniqueness constraint, and lookups all agree on casing regardless of what was typed in (admin, API, fixtures, etc).

Generate the migration (`poetry run python manage.py makemigrations games` from `backend/`), which will produce the next-numbered file after `0084_alter_gamedomain_domain.py` (i.e. `0085_...py`) dropping the unique index and adding the composite constraint. No data migration is needed: the field was globally unique before this change, so no two existing rows can collide once scoped per-group, and MySQL's default collation is already case-insensitive, so no case-collisions can appear either.

### Step 2 — Update `GameDomain` model tests

In `backend/games/tests/models/game/game_domain_test.py`:
- Replace `test_domain_uniqueness` (currently asserts a global `IntegrityError` on any duplicate) with a test asserting the duplicate is rejected only **within the same `GameDomainGroup`**.
- Add a test that two `GameDomain` rows with the same `domain` string succeed when they belong to **different** `GameDomainGroup`s.
- Add a test that saving a mixed-case domain (e.g. `'Foo.Majora.App'`) stores/reads back as lowercase (`'foo.majora.app'`).

### Step 3 — Add `DomainGamesCache`

Create `backend/games/caches/domain_games_cache.py`:

```python
class DomainGamesCache:
    CACHE_TYPE = 'domain_games'

    @classmethod
    def game_ids_for_domain(cls, domain):
        key = domain.lower()
        cached = memory_cache.get(cls.CACHE_TYPE, key)
        if cached is not None:
            return cached
        result = cls._query(key)
        memory_cache.set(cls.CACHE_TYPE, key, result, sys.getsizeof(result))
        return result

    @classmethod
    def game_ids_for_request(cls, request):
        host = request.get_host().split(':')[0]
        return cls.game_ids_for_domain(host)

    @classmethod
    def _query(cls, domain):
        game_domain = GameDomain.objects.filter(domain=domain).first()
        if game_domain is None:
            return []
        return list(
            Game.objects.filter(game_domain_group=game_domain.game_domain_group)
            .values_list('id', flat=True)
        )
```

Notes on the above:
- `domain` field lookups can compare directly against `key` since Step 1 normalizes stored `domain` values to lowercase and `key` is already lowercased here — no `__iexact` needed.
- An unmatched domain caches `[]`, same as a matched domain with zero games — deliberate, per the issue's "Unknown domain" decision, to avoid repeated DB lookups for bad hosts.
- Register the class in `backend/games/caches/__init__.py`'s imports and `__all__`, alongside the existing three cache wrappers.

### Step 4 — Test `DomainGamesCache`

Create `backend/games/tests/caches/domain_games_cache_test.py`, following the shape of `character_editor_cache_test.py` (clear `memory_cache` in `setup_method`, use `GameDomainFactory`/`GameFactory`/`GameDomainGroupFactory` from `games.tests.factories`, `django.test.RequestFactory` for the request-based entry point). Cover:
- `game_ids_for_domain` returns the ids of games under the matching `GameDomainGroup`.
- `game_ids_for_domain` is case-insensitive (querying `'Example.com'` matches a stored `'example.com'` `GameDomain`).
- `game_ids_for_domain` returns `[]` for a domain with no matching `GameDomain`.
- A cache hit is served without re-querying: create the `GameDomain`/`Game`, call once to populate, then delete/reassign the `Game` and call again — the stale cached ids are still returned (same "serves from cache even after underlying data changes" pattern as `character_editor_cache_test.py`'s `test_serves_from_cache_on_hit_even_after_ownership_changes`).
- The cache is stored under `DomainGamesCache.CACHE_TYPE` keyed by the lowercased domain (assert directly via `memory_cache.get(...)`).
- `game_ids_for_request` strips a port from `request.get_host()` before delegating (build the request via `RequestFactory().get('/', HTTP_HOST='example.com:8443')` or equivalent) and produces the same result as calling `game_ids_for_domain` with the bare host.

## Files to Change

- `backend/games/models/game/game_domain.py` — drop field-level `unique=True`, add `Meta.constraints` `UniqueConstraint(['domain', 'game_domain_group'])`, lowercase `domain` in `save()`.
- `backend/games/migrations/0085_*.py` (generated) — migration for the constraint change.
- `backend/games/tests/models/game/game_domain_test.py` — update/add uniqueness and lowercase-normalization tests.
- `backend/games/caches/domain_games_cache.py` (new) — `DomainGamesCache` class.
- `backend/games/caches/__init__.py` — register `DomainGamesCache`.
- `backend/games/tests/caches/domain_games_cache_test.py` (new) — tests for the new cache class.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- This issue is prep only — no view, middleware, or serializer calls `DomainGamesCache` yet; that wiring is deferred to a future issue, per the issue description.
- `memory_cache` has no explicit invalidation hook (only LRU/size-based eviction, per `majora_project/cache/base.py`), matching the existing boolean caches' behavior — a game's domain-group reassignment or a new `GameDomain` won't be reflected until the entry is evicted. This mirrors the accepted staleness tradeoff already made for `AdminOrStaffCache`/`GamePlayerCache`/`CharacterEditorCache`, not a new risk introduced here.
