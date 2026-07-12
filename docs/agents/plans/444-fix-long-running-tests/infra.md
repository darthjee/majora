# Infra Plan: Fix long running Python tests in CI

Main plan: [plan.md](plan.md)

## Shared contracts

None — this change is confined to `.circleci/config.yml` and does not change any env var, settings module name, or other value `backend`'s work depends on. Can land independently of the `backend` plan, in either order.

## Implementation Steps

### Step 1 — Drop the redundant migration step in the pytest CI jobs

In `.circleci/config.yml`, each of the three test jobs — `pytest_views_characters`, `pytest_views_rest`, `pytest_all` — has a `migrate` step running `bin/configure_database.sh all` (`wait_for_db` + `manage.py migrate` against the `majora` DB, per `source/bin/configure_database.sh`). That migrated `majora` database is never used: pytest-django creates its own separate `test_majora` database and runs all migrations against it independently (no `--reuse-db`/`--no-migrations` flag is set anywhere). So the `manage.py migrate` half of that step is pure duplicated work, repeated for each of the 3 jobs.

Change the step's command from `bin/configure_database.sh all` to `bin/configure_database.sh wait` (already a supported subcommand — see the `case` statement in `source/bin/configure_database.sh` — it runs only `wait_for_db`, skipping `migrate`). Update the step's `name:` from `migrate` to something accurate like `wait for db`.

Do this identically in all three jobs. Do not touch `source/bin/configure_database.sh` itself or `source/bin/server.sh` (which still needs the full `all` behavior for real server startup) — this change is scoped to the CI job step commands only.

## Files to Change

- `.circleci/config.yml` — in `pytest_views_characters`, `pytest_views_rest`, and `pytest_all` jobs, change the `migrate` step's command from `bin/configure_database.sh all` to `bin/configure_database.sh wait`, and rename the step.

## CI Checks

- `.circleci/config.yml` itself has no local lint command in this repo; validate by pushing the branch and confirming the `pytest_views_characters`, `pytest_views_rest`, and `pytest_all` jobs still pass on CircleCI (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`).

## Notes

- This is a low-risk, mechanical change: the only thing removed is a migration pass whose output was already provably unused by the subsequent `pytest` step.
- If CI runtime is still measured after this change lands, expect the win to be partial — this addresses only one of three contributors identified in the issue; the other two are in [backend.md](backend.md).
