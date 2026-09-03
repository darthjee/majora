## Context

Parent tracking issue: #1244 (Password Recovery Token Management Overhaul).

The `PasswordResetToken` model already lives in the `accounts` app (`backend/accounts/models/password_reset_token.py`), but its **physical MySQL table is still `games_passwordresettoken`**, pinned there by a `Meta.db_table` override — a leftover of an earlier app layout. The earlier games→accounts move (`accounts/0001_initial` + `games/0071`) was migration-state-only and deliberately left the physical table untouched.

## What needs to be done

Rename the physical table to `accounts_passwordresettoken` (Django's app-label default) and delete the `Meta.db_table` override. **Pure lift-and-shift: no new columns, no data migration** — the `expires_at` / `invalidated_at` schema additions belong to the sibling sub-issue for listing tokens.

### Mechanics

Follows the `domains/migrations/0001_initial.py` precedent (which renamed `games_gamedomain*` → `domains_*`). One new `accounts` migration, `SeparateDatabaseAndState`:

- `state_operations=[migrations.AlterModelTable('passwordresettoken', table=None)]`
- `database_operations=[migrations.RunSQL("RENAME TABLE games_passwordresettoken TO accounts_passwordresettoken;", reverse_sql="RENAME TABLE accounts_passwordresettoken TO games_passwordresettoken;")]`

Notes:

- **No dual-write / copy-swap.** MySQL `RENAME TABLE` is atomic metadata-only; the table is tiny and tokens are short-lived (cf. the `uploads` move's durable-vs-ephemeral note). Fully reversible via `reverse_sql`.
- **No FK column rename** — `user_id` is untouched by a table rename (unlike the `domains` precedent, which also had a FK column to rename).
- **No `HistoricalPasswordResetToken`** — the model has no `HistoricalRecords` yet, so nothing in `versioning` moves with it. *(Snapshot true at this issue's merge only — #1244 sub-issue 4 later adds `HistoricalRecords(app='versioning')` and a fresh `versioning_historicalpasswordresettoken` table; see [Migration ordering](#migration-ordering--relationship-to-1244-siblings).)*
- The only **code** reference to the literal `games_passwordresettoken` outside migration files is the `Meta.db_table` line itself (removed here). Prose references in `docs/` are handled under [Documentation updates](#documentation-updates) below.

### Alternatives considered

- **Do nothing — keep `db_table = 'games_passwordresettoken'` indefinitely.** This is the
  `uploads` precedent (`db_table = 'games_upload'` kept on purpose, rationale: "upload records
  are short-lived and expiring, not durable data" — equally true of reset tokens). Rejected
  because: (1) #1244 is a deliberate move to bring the whole recovery flow into the auth domain,
  of which the table name is part; (2) the closer structural precedent is `domains` — a model
  *wholly owned* by a new app rather than a generic cross-cutting record like `Upload`/`Link` —
  and that one renamed its tables; (3) the override is flagged in-code as "a leftover of an
  earlier app layout", i.e. debt with no ongoing justification.
- **One-liner `migrations.AlterModelTable('passwordresettoken', None)`, no
  `SeparateDatabaseAndState`.** Django's `AlterModelTable` emits the `RENAME TABLE` itself (and
  auto-reverses). The `domains` migration needed the state/DB split because it *also* renamed a
  FK column (`game_domain_group_id` → `domain_group_id`), which a table rename won't do — that
  reason does **not** apply here (no FK column rename). The heavier `SeparateDatabaseAndState` +
  `RunSQL` form is still chosen for: explicit hand-written `reverse_sql`, the exact DDL visible
  in the migration, and consistency with the recognised `domains` shape. Both are valid — the
  one-liner is called out here so a reviewer doesn't flag the `RunSQL` as gold-plating.
- **Copy-swap / dual-write** (new table, backfill, cut over reads, drop old). Rejected — that's
  for large or hot tables that can't tolerate even a brief metadata lock. `RENAME TABLE` on a
  tiny, low-traffic table is atomic and metadata-only; copy-swap adds risk and code for no gain.

### Migration ordering / relationship to #1244 siblings

- **Migration number:** this is `accounts/0008_*` — successor to `0007_cachetoken`, currently the tip of `accounts/migrations/`. Suggested name: `0008_rename_passwordresettoken_table`.
- **Only real coupling — #1244 sub-issue 4**, which adds the `expires_at` / `invalidated_at`
  columns, a `RunPython` backfill, and `HistoricalRecords`. That sub-issue also introduces an
  `accounts` migration; if both branches fork from `0007` independently, the `accounts`
  migration graph gets two `0008_*` leaves sharing a parent — a non-linear graph needing a
  `--merge` migration or a reparent.
- **Resolution:** this issue has no dependency and nothing blocks it; sub-issue 4 is gated
  behind sub-issue 3 (frontend). So this rename lands first in practice, and sub-issue 4's
  column migration branches off it as `0009`. If sub-issue 4 somehow merges first, this
  migration simply bumps its parent/number — no content change.
- **Either physical order is data-safe.** `AddField` and `RENAME TABLE` commute: MySQL
  `RENAME TABLE` carries every column with it. Keeping the `accounts` migration graph linear is
  the only actual constraint between the two.
- **`versioning` side:** sub-issue 4's `versioning_historicalpasswordresettoken` is a fresh
  `CreateModel` table — unaffected by this rename in either order (as #1244 already notes).
- **Not in this issue:** `expires_at` / `invalidated_at`, any `RunPython` backfill, and
  `HistoricalRecords` all belong to sub-issue 4 (reaffirming the scope line above).

### Documentation updates

Only references that this rename actually invalidates are in scope. Exploration found more mentions than the original draft listed — most are **not** stale and must be left alone.

**In scope — genuinely stale after the rename:**

- `backend/accounts/models/password_reset_token.py` — delete the `Meta.db_table` line (already the core of this issue).
- `docs/agents/architecture/backend.md` — the `accounts/` → `models/` bullet currently reads
  "`UserProfile`, `PasswordResetToken` (table names preserved for migration compatibility)".
  After this rename only `UserProfile` keeps its legacy table (`games_userprofile`); reword so
  the "table name preserved" caveat applies to `UserProfile` alone.
- The **new migration's own docstring** carries the full end-state explanation and explicitly
  notes it supersedes the `db_table = 'games_passwordresettoken'` override frozen in
  `accounts/0001_initial`.

**Explicitly out of scope — leave untouched (the original draft over-flagged these):**

- `backend/games/tests/migration_state.py` docstring — its `UserProfile`/`PasswordResetToken`
  mention is about the *model's app move* (`games` → `accounts`), which stays true permanently.
  A table rename does not touch it. (The draft's "refresh the now-stale mention" note was a
  misread and is dropped.)
- Historical migration docstrings — `accounts/0001_initial.py` (lines ~8–11) and
  `games/0071_...py` both say the underlying tables "are untouched". That is accurate as a
  description of what *those* migrations did, and rewriting historical migrations is against the
  `domains`/`uploads` table-move precedent, which added new migrations without retro-editing
  earlier ones. The new migration's docstring is the single source of truth for the end state.
  **The `'db_table': 'games_passwordresettoken'` on `accounts/0001_initial.py` line 49 is frozen
  migration state and must not be edited** — the new `AlterModelTable('passwordresettoken',
  table=None)` state op is what supersedes it.
- `docs/agents/models-organization.md` and `docs/agents/access-control/endpoints.md` mentions —
  about the app move and Django-admin non-registration respectively; neither is affected by a
  table rename.

### Deploy risk window

During `migrate`, still-running old-code instances would 500 on `/recover` + `/reset-password` only, until the new release's processes take over. Acceptable for this low-traffic path — no special handling, just be aware.

### Edge cases

Checked against the actual stack; most theoretical concerns are ruled out.

**Ruled out by the stack — no handling needed:**

- **MySQL-only deployment** — `django.db.backends.mysql` / `mysql:9.3.0`, no SQLite or Postgres
  path anywhere. Raw `RunSQL("RENAME TABLE …")` is safe and follows the `domains` / `versioning`
  / `games` table-move precedents; no cross-backend guard required.
- **No read replicas, no `DATABASE_ROUTERS`** — single DB connection, so no replica-lag or
  read/write-split window to reason about.
- **No background consumer** — no cron or management command touches the table. The only
  readers/writers are `accounts/views/password_reset/_shared.py` (token create + latest-lookup)
  and `reset_password.py` (lookup + `consume`), reached solely via `/recover` and
  `/reset-password`. The deploy risk window above is therefore exactly those two endpoints, with
  nothing hidden behind it.

**Worth an explicit note in the migration / PR:**

- **Fresh-DB / CI replay.** `games/0011_create_password_reset_token` creates
  `games_passwordresettoken` (games-app default, no `db_table` override); the new `accounts`
  migration's `RENAME TABLE` runs strictly after it via the dependency chain
  (`accounts/0007` → … → `games/0071` → `games/0011`). An empty-database build ends on
  `accounts_passwordresettoken` correctly.
- **Concurrent token writes during `migrate`.** All three call sites are single-statement with
  no long-lived transactions, so MySQL `RENAME TABLE`'s metadata-lock window on this tiny table
  is negligible. No application-level quiescing needed.
- **Rollback symmetry.** The new code carries no `db_table` override, so running `reverse_sql`
  (`RENAME TABLE accounts_passwordresettoken TO games_passwordresettoken`) while the new release
  is still live would 500 `/recover` + `/reset-password` — the mirror of the forward window. A
  migration rollback must be paired with a code rollback.
- **Stale FK constraint name.** MySQL keeps the auto-generated `games_passwordresettoken_…`
  constraint name on the `user_id` FK after the rename (the `domains` precedent left theirs
  too). Cosmetic only — leave it; a later migration that alters the FK would regenerate it.

### Backward compatibility

`RENAME TABLE` preserves every row/column/value; in-flight tokens are byte-identical afterward and `is_valid()` is still computed at this point, so a recovery link a user already holds keeps resolving.

### Migration dependencies

`dependencies = [('accounts', '0007_cachetoken')]` **only** — not `initial`. **Do not add a `games` dependency**: `games_passwordresettoken` is created by `games/0011_create_password_reset_token`, already an ancestor via `accounts/0001_initial` → `games/0071` → …, so an explicit `games` edge is redundant and risks a dependency cycle.

### Testing strategy

Context: this repo's migration tests only ever cover `RunPython` data migrations (via the `historical_apps` helper in `backend/games/tests/migration_state.py`, or `MigrationExecutor` + `TransactionTestCase`). There is **no precedent** for asserting `db_table`, introspecting physical table names, or exercising a `RunSQL` `reverse_sql` — and the direct precedent (`domains/migrations/0001_initial.py`) shipped with no dedicated test. The existing `backend/accounts/tests/password_reset/*` tests are ORM-only and pass unchanged after the rename, so they carry no regression signal for this change. This issue therefore adds explicit coverage.

**New file: `backend/accounts/tests/models/password_reset_token_table_migration_test.py`**

1. **State-op assertion** (plain `TestCase`, using `historical_apps`):
   - `historical_apps('accounts', '0007_cachetoken').get_model('accounts', 'PasswordResetToken')._meta.db_table == 'games_passwordresettoken'`
   - `historical_apps('accounts', '0008_rename_passwordresettoken_table').get_model('accounts', 'PasswordResetToken')._meta.db_table == 'accounts_passwordresettoken'`
   - live model: `PasswordResetToken._meta.db_table == 'accounts_passwordresettoken'`

2. **Forward → reverse DDL test** (`TransactionTestCase` + `MigrationExecutor`, mirroring `backend/games/tests/models/character/character_public_slain_migration_test.py`):
   - module-level `_MIGRATE_FROM = [('accounts', '0007_cachetoken')]` / `_MIGRATE_TO = [('accounts', '0008_rename_passwordresettoken_table')]`
   - `executor.migrate(_MIGRATE_FROM)` → assert `'games_passwordresettoken' in connection.introspection.table_names()` and the new name absent
   - `executor.migrate(_MIGRATE_TO)` → assert `'accounts_passwordresettoken'` present, `'games_passwordresettoken'` absent
   - `executor.migrate(_MIGRATE_FROM)` again → assert flipped back (this is the only thing that exercises `reverse_sql`)
   - **Mandatory `tearDownClass` that re-migrates to `graph.leaf_nodes()`** — copy it verbatim from `character_public_slain_migration_test.py`. Without it the test worker is left on the pre-rename schema and every subsequent test sees the wrong table. This is the main footgun.

**Manual acceptance step (no CI guard exists for it):** after adding the migration and deleting the `Meta.db_table` line, `python manage.py makemigrations accounts` must print `No changes` — this is the real check that the `AlterModelTable('passwordresettoken', table=None)` state op exactly matches the model. `.circleci/config.yml` has no `makemigrations --check`; CI only catches a *forward*-broken migration (test DB is rebuilt from migrations every run), never a state mismatch or a broken `reverse_sql`.

## Responsible agent

`backend`

## Dependencies

None. Independent of every other #1244 sub-issue; can land any time.

## Acceptance criteria

- [ ] `PasswordResetToken` is backed by `accounts_passwordresettoken`; the `Meta.db_table` override is gone
- [ ] Single `accounts` migration using `SeparateDatabaseAndState` (`AlterModelTable` state op + `RunSQL` `RENAME TABLE` with `reverse_sql`)
- [ ] New migration declares `dependencies = [('accounts', '0007_cachetoken')]` only (not `initial`, no `games` edge)
- [ ] No new columns and no data migration are introduced by this sub-issue
- [ ] `docs/agents/architecture/backend.md`'s `accounts/models/` bullet is reworded so "table name preserved for migration compatibility" applies to `UserProfile` only; no other doc or historical-migration docstring is touched
- [ ] New `backend/accounts/tests/models/password_reset_token_table_migration_test.py`: a `historical_apps` `TestCase` asserting `db_table` before (`games_passwordresettoken`) and after (`accounts_passwordresettoken`) `0008`, **and** a `TransactionTestCase` migrating forward → asserting the new physical table name via `connection.introspection.table_names()` → reversing → asserting the old name is back, with a `tearDownClass` re-migrate to `leaf_nodes()`
- [ ] Verified manually that `python manage.py makemigrations accounts` reports `No changes` after the `Meta.db_table` line is deleted
