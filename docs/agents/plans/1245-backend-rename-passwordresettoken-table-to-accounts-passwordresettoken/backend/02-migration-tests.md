# Add migration tests

The existing `backend/accounts/tests/password_reset/*` tests are ORM-only and pass unchanged
after the rename, so they carry no regression signal for this change. Add one dedicated test
file covering both halves of the `SeparateDatabaseAndState` op: the model-state change and the
physical DDL (including its reverse).

## What to do

Create **`backend/accounts/tests/models/password_reset_token_table_migration_test.py`** with
two test classes.

### 1. State-op assertion — plain `TestCase` via `historical_apps`

Use `from games.tests.migration_state import historical_apps` (the repo's "migration-state
test" tool).

- `historical_apps('accounts', '0007_cachetoken').get_model('accounts', 'PasswordResetToken')._meta.db_table`
  == `'games_passwordresettoken'`
- `historical_apps('accounts', '0008_rename_passwordresettoken_table').get_model('accounts', 'PasswordResetToken')._meta.db_table`
  == `'accounts_passwordresettoken'`
- live model: `from accounts.models import PasswordResetToken` →
  `PasswordResetToken._meta.db_table == 'accounts_passwordresettoken'`

### 2. Forward → reverse DDL — `TransactionTestCase` via `MigrationExecutor`

Mirror the structure of
`backend/games/tests/models/character/character_public_slain_migration_test.py`:

- module-level `_MIGRATE_FROM = [('accounts', '0007_cachetoken')]` /
  `_MIGRATE_TO = [('accounts', '0008_rename_passwordresettoken_table')]`
- `TransactionTestCase` subclass (real DDL autocommits on MySQL — plain `TestCase` will not
  work).
- **Mandatory `tearDownClass`** — copy verbatim from the precedent:

  ```python
  @classmethod
  def tearDownClass(cls):
      executor = MigrationExecutor(connection)
      executor.loader.build_graph()
      executor.migrate(executor.loader.graph.leaf_nodes())
      super().tearDownClass()
  ```

  Without it the worker is left on the pre-rename schema and every later test sees the wrong
  table. This is the main footgun.

- Test body:
  1. `MigrationExecutor(connection).migrate(_MIGRATE_FROM)` → assert
     `'games_passwordresettoken' in connection.introspection.table_names()` and
     `'accounts_passwordresettoken' not in ...`
  2. `MigrationExecutor(connection).migrate(_MIGRATE_TO)` → assert
     `'accounts_passwordresettoken' in connection.introspection.table_names()` and
     `'games_passwordresettoken' not in ...`
  3. `MigrationExecutor(connection).migrate(_MIGRATE_FROM)` again → assert it flipped back
     (this is the only assertion that exercises `reverse_sql`).

  Re-instantiate `MigrationExecutor` before each `.migrate()` call, as the precedent does.

### 3. Manual acceptance step

Record in the PR description (there is no CI job for it): after Step 01,
`python manage.py makemigrations accounts` prints `No changes`.

## Files to Change

- `backend/accounts/tests/models/password_reset_token_table_migration_test.py` — **new**; the two test classes above. Follow the module docstring / class docstring style of `character_public_slain_migration_test.py`.
