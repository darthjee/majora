# Fix stale architecture doc

Exactly one documentation line becomes wrong after the rename. Everything else that mentions
`PasswordResetToken` is about the model's *app move* (permanent, unaffected) or is frozen
historical-migration prose — leave all of it untouched.

## What to do

Edit **`docs/agents/architecture/backend.md`**. The `accounts/` → `models/` bullet currently
reads:

> - `models/` — `UserProfile`, `PasswordResetToken` (table names preserved for migration compatibility).

After this change only `UserProfile` keeps its legacy table (`games_userprofile`).
`PasswordResetToken` now uses the Django default `accounts_passwordresettoken`. Reword so the
"table name preserved for migration compatibility" caveat applies to `UserProfile` only — e.g.:

> - `models/` — `UserProfile` (table `games_userprofile` preserved for migration compatibility), `PasswordResetToken`.

Keep the surrounding list formatting and line length (≤100 chars) consistent with the rest of
the file.

## Do NOT touch

- `backend/games/tests/migration_state.py` docstring — its `PasswordResetToken` mention is
  about the `games` → `accounts` model move, still true.
- `backend/accounts/migrations/0001_initial.py` and
  `backend/games/migrations/0071_...py` docstrings — accurate descriptions of what those
  migrations did; rewriting historical migrations is against the `domains`/`uploads`
  precedent. The `'db_table': 'games_passwordresettoken'` literal on
  `accounts/0001_initial.py` line ~49 is frozen state and must stay.
- `docs/agents/models-organization.md` and `docs/agents/access-control/endpoints.md` — the
  first is about the app move, the second about Django-admin non-registration; neither is
  affected by a table rename.

## Files to Change

- `docs/agents/architecture/backend.md` — reword one bullet so "table name preserved for migration compatibility" applies to `UserProfile` alone.
