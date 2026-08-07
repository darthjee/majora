# Plan: Register domain on statistics

Issue: [1015-register-domain-on-statistics.md](../issues/1015-register-domain-on-statistics.md)

## Overview

Extract `games.GameDomain`/`games.GameDomainGroup` (plus their CSRF-origins middleware)
into a new standalone `domains` app as `Domain`/`DomainGroup`, since the domain concept
is no longer games-specific. Then add a nullable `domain` FK to `statistics.Session`,
resolved from the request host on every request, factored into both session-mismatch
handling (rotates the session, same as the existing IP-mismatch handling) and the
token-based session lookup.

Single agent involved (`backend` — everything here lives under `backend/`), so this is
the only plan file; no per-agent split.

## Context

- `statistics.Session` (`backend/statistics/models.py`) currently has no domain
  reference at all — `token`, `user`, `ip`, `created_at`, `last_seen_at` only.
- `games.GameDomain`/`games.GameDomainGroup` (`backend/games/models/game/game_domain*.py`)
  currently model the domain concept, but under the `games` app — the wrong coupling
  direction once `statistics` (this issue) and a future STL/3D-file repository app both
  need to reference domains without depending on `games`.
- `GameDomain`/`GameDomainGroup` use `HistoricalRecords(app='versioning', ...)`, so their
  audit-trail models (`HistoricalGameDomain`, `HistoricalGameDomainGroup`) actually live in
  the `versioning` app's migrations, not `games`'s. Per the issue's decision, this history
  is **wiped**, not migrated — the `domains` app gets fresh, empty history tables.
- `games.middleware.GameDomainCsrfOriginsMiddleware` moves to `domains/middleware.py`
  (renamed `DomainCsrfOriginsMiddleware`) alongside the models, per the issue's decision.
- `statistics`'s cookie is host-scoped (`_set_cookie` in `statistics/middleware.py`), so a
  domain mismatch on an incoming token can only happen via a non-browser client or a bug —
  handled exactly like the existing IP-mismatch case (session rotation), not as an error.

## Implementation Steps

### Step 1 — Scaffold the `domains` app

Create `backend/domains/` mirroring the `statistics` app's shape (single small app, not
the `games/models/` multi-file package convention — `games` needs that layout because it
has dozens of models; `domains` has two):
- `domains/__init__.py`, `domains/apps.py` (`DomainsConfig`, `default_auto_field =
  'django.db.models.BigAutoField'`, `name = 'domains'`)
- `domains/models.py` — see Step 2
- `domains/admin.py`, `domains/middleware.py` — see Step 5
- `domains/migrations/__init__.py`
- `domains/tests/__init__.py`, `domains/tests/factories/`, `domains/tests/models/`,
  `domains/tests/caches/` (relocated content, see Step 6)

Add `'domains'` to `INSTALLED_APPS` in `backend/majora_project/settings.py`, right after
`'games'` (alphabetical-ish grouping already used there — `games`, `accounts`,
`versioning`, `statistics`, `conversations`; insert wherever reads cleanest, e.g. after
`'games'` since `domains` is games-adjacent history-wise).

### Step 2 — Move `Domain`/`DomainGroup` models, preserving row data

`domains/models.py`:

```python
class DomainGroup(models.Model):
    """Model representing a tenant/brand reachable through multiple hostnames."""

    name = models.CharField(max_length=200)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        return self.name


class Domain(models.Model):
    """Model representing a hostname that resolves to a DomainGroup."""

    domain = models.CharField(max_length=200, unique=True, validators=[validate_domain])
    domain_group = models.ForeignKey(DomainGroup, on_delete=models.CASCADE, related_name='domains')
    schemes = models.CharField(max_length=20, default='https', validators=[validate_schemes])
    title = models.CharField(max_length=200, blank=True, default='')
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def save(self, *args, **kwargs):
        self.domain = self.domain.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.domain

    @property
    def origins(self):
        return [f'{scheme}://{self.domain}' for scheme in self.schemes.split(',')]
```

Same `validate_domain`/`validate_schemes` `RegexValidator`s as today, copied over
verbatim. **Field rename**: `GameDomain.game_domain_group` → `Domain.domain_group` — now
that this is internal to the domain-generic `domains` app, the `game_` prefix no longer
fits (unlike `games.Game.game_domain_groups`, which stays as-is per the issue — that name
is still meaningful in the `games` app's own context). `related_name='domains'` is
unchanged (already domain-appropriate: `domain_group.domains.all()`).

Migration (`domains/migrations/0001_initial.py`) must both update Django's model state
*and* preserve the actual row data by renaming the existing tables rather than dropping
and recreating them — a plain `CreateModel` would create empty tables:

```python
class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(name='DomainGroup', fields=[...]),  # same fields as games' 0082/0086, sans history
                migrations.CreateModel(name='Domain', fields=[...]),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "RENAME TABLE games_gamedomaingroup TO domains_domaingroup, "
                        "games_gamedomain TO domains_domain;"
                    ),
                    reverse_sql=(
                        "RENAME TABLE domains_domaingroup TO games_gamedomaingroup, "
                        "domains_domain TO games_gamedomain;"
                    ),
                ),
            ],
        ),
    ]
```

MySQL 8 (per `AGENTS.md`) supports multi-table `RENAME TABLE` in one atomic statement.
Confirm the exact current table names (`games_gamedomain`, `games_gamedomaingroup` —
Django's default `<app_label>_<model_name lowercased>` scheme, no custom `db_table` set
on either model today) before writing this migration for real.

### Step 3 — Wipe old history, create fresh history in `domains` (via `versioning`)

Add a new `versioning` migration, depending on `domains`'s `0001_initial`:
- `migrations.DeleteModel('HistoricalGameDomain')`,
  `migrations.DeleteModel('HistoricalGameDomainGroup')` — drops the old audit tables and
  their data entirely (explicitly OK'd in the issue — "not a problem").
- `migrations.CreateModel('HistoricalDomain', ...)`,
  `migrations.CreateModel('HistoricalDomainGroup', ...)` — fresh, empty history tables
  matching what `simple_history` would auto-generate for the moved `Domain`/`DomainGroup`
  models (same shape as the deleted ones, minus the `game_` naming, FK `to=` targets
  `domains.domaingroup`/`domains.domain`).

In practice, generate this via `makemigrations` after Steps 1-2 land and the old
`GameDomain`/`GameDomainGroup` model files are removed from `games` (Step 4) — Django/
`simple_history` will detect the model move as delete+create automatically; just confirm
the generated migration doesn't try to auto-preserve data (it shouldn't, since the old
and new historical models don't share a table name) and check it depends on the right
prior migrations (`domains.0001_initial`, plus whatever `versioning` migration removes
`HistoricalGame.game_domain_group` — see Step 4).

### Step 4 — Repoint `games` at `domains`

- Delete `games/models/game/game_domain.py` and `games/models/game/game_domain_group.py`.
- Remove their imports/`__all__` entries from `games/models/__init__.py`.
- `games/models/game/game.py`: `game_domain_groups` M2M's target changes from
  `'games.GameDomainGroup'` to `'domains.DomainGroup'`. Field name on `Game` stays
  `game_domain_groups` (per the issue's decision — still meaningful in this context).
- New `games` migration (depends on `domains.0001_initial`):
  `SeparateDatabaseAndState(state_operations=[DeleteModel('GameDomain'),
  DeleteModel('GameDomainGroup'), AlterField('game', 'game_domain_groups', ...new
  target...)], database_operations=[])` — state-only; the actual tables were already
  renamed away in Step 2's `domains` migration, and the M2M *through* table
  (`games_game_game_domain_groups`) keeps working unchanged since only the FK's Python-
  level target model changed, not the through-table's own columns.
- The historical `Game.game_domain_group` FK (from `versioning`'s `0019`/`0022`
  migrations, `to='games.gamedomaingroup'`) needs its `to=` updated to
  `'domains.domaingroup'` too — fold into Step 3's `versioning` migration or a follow-up
  one; check with `makemigrations --check` once Steps 2-4 are all in place.

### Step 5 — Move the CSRF middleware, caches, admin, settings references

- Move `GameDomainCsrfOriginsMiddleware` from `games/middleware.py` to
  `domains/middleware.py`, renamed `DomainCsrfOriginsMiddleware`, importing
  `domains.models.Domain` instead of `games.models.GameDomain`. `games/middleware.py`
  keeps `CacheControlMiddleware` untouched.
- Update the `MIDDLEWARE` entry in `majora_project/settings.py` from
  `'games.middleware.GameDomainCsrfOriginsMiddleware'` to
  `'domains.middleware.DomainCsrfOriginsMiddleware'` (keep its position in the list
  unchanged — it must still run before `CsrfViewMiddleware`).
- `games/caches/domain_games_cache.py` and `games/caches/registered_domains_cache.py`:
  swap their lazy `from games.models.game.game_domain import GameDomain` imports for
  `from domains.models import Domain`, and `GameDomain.objects...` /
  `game_domain.game_domain_group` → `Domain.objects...` / `domain.domain_group`
  (Step 2's field rename). Consider whether these two caches themselves should move to
  `domains/caches/` — they're domain-resolution caches, but `DomainGamesCache` also
  returns `Game` ids, so it's arguably still games-specific glue; leaving both in
  `games/caches/` (just repointed at `domains.models.Domain`) is the lower-churn call and
  is fine to keep.
- `games/views/games/games_list.py`: swap `GameDomain` import for
  `domains.models.Domain`, and `game_domain.game_domain_group` →
  `domain.domain_group` (line ~68).
- `games/admin.py`: remove `GameDomain`/`GameDomainGroup` from the import and the two
  `admin.site.register(...)` calls; add them (as `Domain`/`DomainGroup`) to
  `domains/admin.py` instead (no custom `ModelAdmin` needed — same as today, plain
  `admin.site.register(...)`).
- `majora_project/settings.py`: update the comment above `ENABLE_GAMES_PER_DOMAIN`
  referencing `GameDomain`/`GameDomainGroup` to say `domains.Domain`/`domains.DomainGroup`.

### Step 6 — Move and rename tests/factories

- `games/tests/factories/game_domain.py` → `domains/tests/factories/domain.py`:
  `GameDomainGroupFactory`→`DomainGroupFactory`, `GameDomainFactory`→`DomainFactory`,
  field `game_domain_group=factory.SubFactory(...)` → `domain_group=factory.SubFactory(...)`.
  Export from `domains/tests/factories/__init__.py`.
- `games/tests/models/game/game_domain_test.py` →
  `domains/tests/models/domain_test.py`; `games/tests/models/game/game_domain_group_test.py`
  → `domains/tests/models/domain_group_test.py`. Update class/attribute names
  (`domain.game_domain_group` → `domain.domain_group`).
- `games/tests/game_domain_middleware_test.py` → `domains/tests/middleware_test.py`
  (tests `DomainCsrfOriginsMiddleware`).
- `games/tests/caches/domain_games_cache_test.py`,
  `games/tests/caches/registered_domains_cache_test.py`: stay in `games/tests/caches/`
  (caches stay in `games`, per Step 5), but update their factory imports to
  `domains.tests.factories` and `.game_domain_group` attribute reads to `.domain_group`.
- `games/tests/factories/__init__.py`: drop the `GameDomainFactory`/`GameDomainGroupFactory`
  re-exports (now live under `domains.tests.factories`).
- `games/tests/views/games/games_list_test.py`: import `DomainFactory` from
  `domains.tests.factories` instead of `games.tests.factories`; update
  `self.game_domain.game_domain_group` → `self.game_domain.domain_group` (lines ~197, ~286).
- `games/tests/factories/game.py` and `games/tests/models/game/game_test.py`: update their
  `GameDomainGroup`/`GameDomainGroupFactory` references to `domains.models.DomainGroup` /
  `domains.tests.factories.DomainGroupFactory`.

### Step 7 — Add `domain` to `statistics.Session`

`statistics/models.py`:

```python
domain = models.ForeignKey(
    'domains.Domain', null=True, blank=True,
    on_delete=models.SET_NULL, related_name='statistics_sessions',
)
```

New migration in `statistics/migrations/`, `dependencies` including `('domains',
'0001_initial')` alongside the existing dependency on `statistics`'s own prior migration.
No backfill — existing rows get `domain=NULL` via a plain nullable `AddField`.

### Step 8 — Wire domain resolution into `StatisticsSessionMiddleware`

`statistics/middleware.py`:
- Add a `_domain_for_request(request)` helper resolving
  `request.get_host().split(':')[0].lower()` → `Domain.objects.filter(domain=...).first()`
  (returns `None` on no match — mirrors `DomainGamesCache.game_ids_for_request`'s host
  extraction). Import `from domains.models import Domain`.
- `__call__`: compute `domain = self._domain_for_request(request)` alongside the existing
  `ip = self._client_ip(request)`, and pass it through to `_load_or_create_session`.
- `_load_or_create_session(self, request, ip, domain)`: extend the reuse condition to
  `session is not None and session.ip == ip and session.domain_id == domain_id_of(domain)`
  — compare by id (`session.domain_id == (domain.id if domain else None)`) to avoid an
  extra query/model-equality footgun — and pass `domain=domain` into
  `Session.objects.create(...)` on the fallback/rotation path.
- `_session_from_cookie(self, request, domain)`: filter
  `Session.objects.filter(token=token, domain=domain).first()` — matches the issue's
  explicit ask for domain to be part of the lookup filter directly (behaviorally
  equivalent to the id-comparison above, since a domain mismatch already means "no
  reusable session" either way; the literal query-level filter is what the issue asked for).

`statistics/session_attachment.py`'s `attach_user`: the rotation path
(`Session.objects.create(ip=session.ip, user=user)`) must also carry the domain forward
— `Session.objects.create(ip=session.ip, user=user, domain=session.domain)` — otherwise
backfilling an authenticated user (not a domain-mismatch event) would silently drop the
session's domain. Same fix applies to `Session.objects.create(ip=ip, user=user,
domain=domain)` in the middleware's own rotation path (Step 8's `_load_or_create_session`
above already covers that one).

### Step 9 — Tests

- `statistics/tests/middleware_test.py`: add cases mirroring the existing IP ones —
  reuses session when domain matches, rotates to a new session when domain mismatches,
  and a registered-`Domain` host attaches the right `domain` on creation. Existing tests
  hit unregistered hosts (`testserver` default), so they keep passing unchanged with
  `domain=None`.
- `statistics/tests/models/session_test.py`: add `test_domain_is_nullable` /
  `test_domain_can_be_set` / `test_deleting_domain_sets_session_domain_to_none`, mirroring
  the existing `user` FK test trio, using the new `domains.tests.factories.DomainFactory`.
- `statistics/tests/session_attachment_test.py`: add a case asserting the rotated session
  from `attach_user` carries the original session's `domain` forward.

## Files to Change

- `backend/majora_project/settings.py` — add `'domains'` to `INSTALLED_APPS`, repoint the
  CSRF middleware entry, update the `GameDomain`/`GameDomainGroup` comment
- `backend/domains/` (new) — `__init__.py`, `apps.py`, `models.py`, `admin.py`,
  `middleware.py`, `migrations/0001_initial.py`, `tests/**`
- `backend/games/models/__init__.py` — drop `GameDomain`/`GameDomainGroup`
- `backend/games/models/game/game_domain.py`, `game_domain_group.py` — deleted
- `backend/games/models/game/game.py` — `game_domain_groups` M2M target
- `backend/games/migrations/` (new) — state-only removal + `game_domain_groups` `AlterField`
- `backend/games/middleware.py` — `GameDomainCsrfOriginsMiddleware` removed
- `backend/games/caches/domain_games_cache.py`,
  `backend/games/caches/registered_domains_cache.py` — repoint imports
- `backend/games/views/games/games_list.py` — repoint import + attribute access
- `backend/games/admin.py` — drop domain model registrations
- `backend/versioning/migrations/` (new) — drop old historical models, create new ones,
  retarget `HistoricalGame.game_domain_group`'s `to=`
- `backend/games/tests/**` — moved/updated per Step 6
- `backend/statistics/models.py` — add `domain` FK
- `backend/statistics/migrations/` (new) — `AddField(domain)`
- `backend/statistics/middleware.py` — domain resolution, mismatch handling, lookup filter
- `backend/statistics/session_attachment.py` — carry `domain` through rotation
- `backend/statistics/tests/**` — new/updated cases per Step 9

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` from
  `backend/` (CI job: `pytest_views_rest`) — covers the updated
  `games/tests/views/games/games_list_test.py`
- `backend`: `poetry run pytest --ignore=games/tests/views/` from `backend/` (CI job:
  `pytest_all`) — covers `domains/`, `statistics/`, and the moved/updated `games` model,
  cache, middleware, and admin tests
- `checks`: `poetry run ruff check .`

## Notes

- No API/serializer/view changes for `statistics` — it has none today and still won't.
- No Navi cache-warmer config changes — no new/changed API endpoints are introduced by
  this issue (confirmed: `statistics` remains endpoint-free, `domains` introduces no
  endpoints either).
- The `Domain.domain_group` field rename (Step 2) and the resulting ripple through
  `games/caches/domain_games_cache.py`, `games/views/games/games_list.py`, and several
  test files (Step 5/6) is a judgment call favoring naming consistency over minimizing
  diff size — flag during review if a lower-churn alternative (keeping the
  `game_domain_group` name) is preferred instead.
- The exact current DB table names (`games_gamedomain`, `games_gamedomaingroup`) should
  be double-checked against a real `SHOW TABLES`/`\d` before writing Step 2's `RunSQL`,
  in case any historical migration ever set a custom `db_table` (none found in this
  exploration, but worth confirming against the live schema, not just migration files).
- Step 3's exact `versioning` migration content is easiest to get right by actually
  running `makemigrations` locally against the moved models rather than hand-writing it —
  the steps above describe the *shape* it must take (drop old, create new, retarget
  `HistoricalGame`), not literal migration code.
