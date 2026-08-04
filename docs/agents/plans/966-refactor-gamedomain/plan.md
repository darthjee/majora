# Plan: Refactor GameDomain

Issue: [966-refactor-gamedomain.md](../issues/966-refactor-gamedomain.md)

## Overview

Make `GameDomain.domain` globally unique and add a `title` field to it, and replace
`Game.game_domain_group` (nullable FK) with a `game_domain_groups` M2M to `GameDomainGroup`, so
a game can be shown under multiple domains or restricted to specific ones. Update the one piece
of code that reads the old singular relationship (`DomainGamesCache._query`), the admin, the
factories, and their tests.

## Context

Today `GameDomain` is unique on `(domain, game_domain_group)`, so the same hostname can appear
on more than one row (one per group) — which would make a new `title` field drift out of sync
across those duplicate rows. `Game.game_domain_group` is a nullable singular FK, so a game can
only ever belong to zero or one group today, with no way to make it appear across several
domains while restricting others to just one.

This issue is backend-only: no serializer currently exposes `GameDomain`/`GameDomainGroup`
fields (confirmed via `backend/games/serializers/`), so there is no API surface to update, and
no frontend wiring is in scope.

## Implementation Steps

### Step 1 — GameDomain: unique `domain`, add `title`

In `backend/games/models/game/game_domain.py`:
- Replace the `UniqueConstraint(fields=['domain', 'game_domain_group'], name='unique_domain_per_group')`
  with a `unique=True` on the `domain` field itself (or a single-field `UniqueConstraint`,
  whichever this codebase's convention favors elsewhere) — drop `game_domain_group` from the
  uniqueness check entirely. `game_domain_group` itself stays exactly as-is (still a singular
  `ForeignKey`).
- Add `title = models.CharField(max_length=200, blank=True, default='')` (or `null=True,
  blank=True` if a genuinely-unset state should be distinguished from an empty string — pick
  whichever matches this app's existing convention for optional text fields, e.g. `Game.description`
  uses `blank=True, default=''`).

Generate the migration (`python manage.py makemigrations games` inside the backend container,
per `AGENTS.md`'s "always through docker-compose" rule). No data migration is needed for the
uniqueness change — every `GameDomainGroup` currently has a single `GameDomain` and they are
all already distinct domains, per the issue's "Safe" analysis. The new `title` field needs no
backfill since it defaults to an empty string.

### Step 2 — Game: FK → M2M

In `backend/games/models/game/game.py`:
- Replace:
  ```python
  game_domain_group = models.ForeignKey(
      'games.GameDomainGroup',
      on_delete=models.SET_NULL,
      null=True,
      blank=True,
      related_name='games',
  )
  ```
  with:
  ```python
  game_domain_groups = models.ManyToManyField(
      'games.GameDomainGroup',
      blank=True,
      related_name='games',
  )
  ```

Generate the migration. Since this is a real relationship-type change (not just a rename),
write a **data migration** alongside the schema migration: for every `Game` with a non-null
`game_domain_group_id`, add that group to the new `game_domain_groups` M2M before the old
column is dropped. Games with a null `game_domain_group` get zero M2M rows — same "invisible on
every domain" outcome as today, per the issue's explicit semantics (no implicit
"empty = global" behavior).

### Step 3 — Update `DomainGamesCache`

In `backend/games/caches/domain_games_cache.py`, `_query` currently does:

```python
Game.objects.filter(game_domain_group=game_domain.game_domain_group)
```

Change to filter through the new M2M field:

```python
Game.objects.filter(game_domain_groups=game_domain.game_domain_group)
```

This still resolves against a single `GameDomainGroup`, since `GameDomain`'s side of the
relationship isn't changing — only the field name on the `Game` side.

### Step 4 — Admin

In `backend/games/admin.py`, add `filter_horizontal = ('game_domain_groups',)` to the existing
`GameAdmin` class so the new M2M renders as Django's searchable dual-list widget rather than the
default multi-select box (this is the only place staff assign a game to its domain groups).

### Step 5 — Factories

In `backend/games/tests/factories/game.py`, `GameFactory` currently has no
`game_domain_group` attribute declared (it's set ad hoc per-test via
`GameFactory(game_domain_group=...)`, which works today because it's a plain FK). Since Django
model constructors reject M2M kwargs outright, add a `@factory.post_generation` hook so tests
can keep passing groups at construction time, e.g.:

```python
@factory.post_generation
def game_domain_groups(self, create, extracted, **kwargs):
    """Attach any GameDomainGroups passed at construction time."""
    if not create or not extracted:
        return
    self.game_domain_groups.set(extracted)
```

`backend/games/tests/factories/game_domain.py` (`GameDomainFactory`,
`GameDomainGroupFactory`) needs no change — `GameDomain.game_domain_group` is still a plain FK.

### Step 6 — Update existing tests

- `backend/games/tests/models/game/game_domain_test.py`:
  - `test_domain_uniqueness_within_same_group` — rename to reflect the new, broader constraint
    (e.g. `test_domain_uniqueness`) if it still reads as duplicating the same domain+group.
  - `test_domain_allowed_across_different_groups` — this now must raise `IntegrityError`
    instead of succeeding; rewrite (and likely rename to
    `test_domain_rejected_across_different_groups`) to assert the same domain string is now
    rejected across two different groups.
  - `test_domain_requires_group` — unaffected (still tests `game_domain_group=None` on the
    unchanged FK).
  - Add coverage for the new `title` field (default value, and that it accepts/persists a
    custom value).
- `backend/games/tests/models/game/game_test.py`:
  - `test_game_domain_group_is_optional` — update to assert
    `game.game_domain_groups.count() == 0` (or `.exists()`) instead of `is None`.
  - `TestGameDomainGroupSetNull` — this class tests `on_delete=SET_NULL` behavior, which no
    longer applies to an M2M (deleting a `GameDomainGroup` just removes the M2M row, it can't
    null out a field that no longer exists). Rewrite as a `CASCADE`-style M2M test: deleting the
    group removes it from `game.game_domain_groups` but does not delete the game itself. Update
    the factory calls from `game_domain_group=cls.domain_group` to
    `game_domain_groups=[cls.domain_group]`.
- `backend/games/tests/caches/domain_games_cache_test.py`: every
  `GameFactory(game_domain_group=self.game_domain.game_domain_group)` call becomes
  `GameFactory(game_domain_groups=[self.game_domain.game_domain_group])`. Also worth adding one
  new case: a game linked to two groups is returned under both groups' domains, confirming the
  M2M actually fans out.

## Files to Change

- `backend/games/models/game/game_domain.py` — unique `domain`, add `title` field.
- `backend/games/models/game/game.py` — `game_domain_group` FK → `game_domain_groups` M2M.
- `backend/games/migrations/` — new schema migration(s) plus a data migration moving existing
  `Game.game_domain_group_id` values into the new M2M table before the old column drops.
- `backend/games/caches/domain_games_cache.py` — filter through `game_domain_groups`.
- `backend/games/admin.py` — `filter_horizontal` on `GameAdmin`.
- `backend/games/tests/factories/game.py` — `post_generation` hook for `game_domain_groups`.
- `backend/games/tests/models/game/game_domain_test.py` — uniqueness test updates, `title`
  coverage.
- `backend/games/tests/models/game/game_test.py` — M2M-shaped assertions, delete `SET_NULL`
  test in favor of an M2M-removal test.
- `backend/games/tests/caches/domain_games_cache_test.py` — factory call-site updates, one new
  multi-group case.

## CI Checks

- `backend/`: `poetry run pytest games/tests/ --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `games/tests/models/` and `games/tests/caches/`.
- `backend/`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirmed via `backend/games/serializers/`: nothing currently serializes `GameDomain`,
  `GameDomainGroup`, or `Game.game_domain_group`, so this refactor has no API-surface or
  frontend impact beyond what the issue already scopes out.
- `GameDomainCsrfOriginsMiddleware` (`backend/games/middleware.py`) iterates
  `GameDomain.objects.all()` directly and never touches `game_domain_group`/`game_domain_groups`
  — unaffected by either model change.
- The `title` field's exact blank/null convention should match whatever this codebase already
  does for similar optional `CharField`s (e.g. `Game.description`) — worth a quick grep during
  implementation rather than guessing.
