# Rename the physical table

Add one new `accounts` migration that renames `games_passwordresettoken` →
`accounts_passwordresettoken` and remove the model's `Meta.db_table` override in the same
change, so migration state and the database agree.

## What to do

1. **Create `backend/accounts/migrations/0008_rename_passwordresettoken_table.py`** as a
   `SeparateDatabaseAndState` operation:

   - `dependencies = [('accounts', '0007_cachetoken')]` — **only this**. Not `initial`. No
     `games` dependency (redundant and cycle-prone).
   - `state_operations = [migrations.AlterModelTable('passwordresettoken', table=None)]` —
     lowercase model name; `table=None` resets to the app-label default
     `accounts_passwordresettoken`.
   - `database_operations = [migrations.RunSQL(`
     `  "RENAME TABLE games_passwordresettoken TO accounts_passwordresettoken;",`
     `  reverse_sql="RENAME TABLE accounts_passwordresettoken TO games_passwordresettoken;")]`
   - Module docstring: state that this performs the physical rename deferred by the earlier
     migration-state-only games→accounts move, and that it **supersedes the
     `db_table = 'games_passwordresettoken'` override frozen in `accounts/0001_initial`**
     (which must not be edited). Note `RENAME TABLE` is atomic metadata-only and fully
     reversible; every row/column/value is preserved, so in-flight recovery links keep
     resolving.

2. **Remove the `Meta.db_table` override** from
   `backend/accounts/models/password_reset_token.py`:

   ```python
   class Meta:
       """Metadata for the PasswordResetToken model."""

       db_table = 'games_passwordresettoken'
   ```

   Delete the `db_table` line. If it leaves an empty `Meta` (only the docstring), remove the
   whole `class Meta` block — nothing else is in it.

3. **Verify (manual — no CI guard):** run
   `docker-compose run --rm majora_tests python manage.py makemigrations accounts` and confirm
   it prints `No changes`. If Django proposes a new `AlterModelTable`, the state op in step 1
   is missing or misnamed — fix before proceeding.

4. **Verify reversibility (manual):** `python manage.py migrate accounts 0008` then
   `python manage.py migrate accounts 0007` should both succeed against a MySQL database.

## Files to Change

- `backend/accounts/migrations/0008_rename_passwordresettoken_table.py` — **new**; the `SeparateDatabaseAndState` rename migration described above.
- `backend/accounts/models/password_reset_token.py` — remove the `db_table = 'games_passwordresettoken'` override (and the now-empty `class Meta` if nothing else remains in it).
