# Backend Plan: Backend — rename PasswordResetToken table to accounts_passwordresettoken

Main plan: [plan.md](plan.md)

## Overview

`PasswordResetToken` already lives in the `accounts` app (`backend/accounts/models/password_reset_token.py`)
but its physical table is still `games_passwordresettoken`, pinned by a `Meta.db_table`
override left over from an earlier app layout. This plan renames the table to
`accounts_passwordresettoken` via a single `accounts` migration following the
`domains/migrations/0001_initial.py` precedent, removes the override, adds migration tests,
and corrects one stale documentation line.

Sub-issue 1 of the #1244 tracking issue. **No new columns, no data migration, no
`HistoricalRecords`** — those belong to #1244 sub-issue 4.

## Context

- **Model:** `backend/accounts/models/password_reset_token.py` — `class Meta: db_table = 'games_passwordresettoken'` is the only non-migration code reference to the literal old name.
- **State history:** `games/0011_create_password_reset_token` created the table (games-app default, no override); `games/0071` deleted the model from `games` state only; `accounts/0001_initial` recreated it in `accounts` state only, with `options={'db_table': 'games_passwordresettoken'}` to keep the physical table stable. All three are frozen historical migrations — **do not edit them**, including the `'db_table'` literal on `accounts/0001_initial.py` line ~49.
- **Migration tip:** `backend/accounts/migrations/0007_cachetoken.py` is the current head of the `accounts` graph. The new migration is `0008`.
- **Precedent:** `backend/domains/migrations/0001_initial.py` renamed `games_gamedomain*` → `domains_*` with `SeparateDatabaseAndState` (`RunSQL RENAME TABLE`). It also renamed a FK column, which this issue does **not** need. `backend/uploads/migrations/0001_initial.py` is the counter-precedent (kept its `games_upload` override) — not followed here, because #1244 deliberately moves the whole recovery flow into the auth domain and `domains` is the closer structural match (a model wholly owned by an app).
- **Stack:** MySQL only (`django.db.backends.mysql`, `mysql:9.3.0`); no SQLite/Postgres path, no read replicas, no `DATABASE_ROUTERS`. Raw `RunSQL("RENAME TABLE …")` is safe and matches existing precedent.
- **Runtime consumers:** only `backend/accounts/views/password_reset/_shared.py` and `backend/accounts/views/password_reset/reset_password.py`, both ORM-only, reached solely via `/recover` and `/reset-password`. No cron / management command touches the table. During `migrate`, still-running old-code instances 500 on those two endpoints only until the new release takes over — acceptable for this low-traffic path, no special handling.
- **Migration testing culture:** the repo only has `RunPython` data-migration tests, via the `historical_apps` helper (`backend/games/tests/migration_state.py`) or `MigrationExecutor` + `TransactionTestCase` (`backend/games/tests/models/character/character_public_slain_migration_test.py`). No precedent for asserting `db_table`, introspecting physical table names, or exercising `RunSQL` `reverse_sql`. No `makemigrations --check` guard exists in CI (`.circleci/config.yml` `checks` job = `ruff` + `bin/reports.sh ci` only).

## Steps

- [01 — Rename the physical table](backend/01-rename-table.md)
- [02 — Add migration tests](backend/02-migration-tests.md)
- [03 — Fix stale architecture doc](backend/03-update-docs.md)

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all` — runs `poetry run pytest --ignore=games/tests/views/`, which includes `backend/accounts/tests/`)
- `backend/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- `docs/`: `docker-compose run --rm majora_fe yarn lint_md` (CI job: `markdownlint` — covers the edited `docs/agents/architecture/backend.md` and these plan files)

There is **no** `makemigrations --check` job — the "no changes" verification in Step 1 is manual and must be done by the implementer.

## Notes

- **`makemigrations` no-op is the real correctness check and CI will not catch a failure.** After Step 1, `python manage.py makemigrations accounts` must print `No changes`. If the `AlterModelTable` state op is missing or misnamed, Django will want to autogenerate its own — that is the signal something is wrong. CI only catches a *forward*-broken migration (the test DB is rebuilt from migrations every run); it never runs `reverse_sql` or detects a state mismatch.
- **Deploy ordering:** migration before code, as usual. The rename is reversible via `reverse_sql`, but a rollback must be paired with a code rollback — the post-change model has no `db_table` override, so renaming the table back while new code is live would 500 `/recover` + `/reset-password` (mirror of the forward window).
- **#1244 sub-issue 4 coupling:** sub-issue 4 adds `expires_at` / `invalidated_at` + a `RunPython` backfill + `HistoricalRecords` in its own `accounts` migration. Keep the `accounts` graph linear — this issue lands first (nothing blocks it; sub-issue 4 is gated behind sub-issue 3), so sub-issue 4 branches off `0008` as `0009`. If sub-issue 4 somehow merges first, bump this migration's parent/number — no content change. `AddField` and `RENAME TABLE` commute either way (MySQL `RENAME TABLE` carries all columns).
- **Stale FK constraint name:** MySQL keeps the auto-generated `games_passwordresettoken_user_id_…` constraint name on `user_id` after the rename (the `domains` precedent left theirs too). Cosmetic — leave it; `makemigrations` will not flag it.
- **Do not add a `games` dependency** to the new migration — `games_passwordresettoken` is created by `games/0011`, already an ancestor via `accounts/0001_initial` → `games/0071` → …; an explicit edge is redundant and risks a cycle.
