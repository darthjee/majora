# Issue: Dev stack: backend tests can't create test_majora locally (MySQL 1044 for user majora)

## Description
Local backend test runs on the dev stack fail almost entirely during test-database setup, while CI passes. This issue aligns the local MySQL test setup with CI and production: same MySQL version (8.4), root credentials for the test runner, and a test container that waits for MySQL without ever publishing a host port.

### Observations

- `docker-compose.yml` → `majora_mysql` (`mysql:9.3.0`) sets `MYSQL_DATABASE: majora` and `MYSQL_USER: majora`. The official image only grants `MYSQL_USER` privileges on `MYSQL_DATABASE`:
  ```
  GRANT USAGE ON *.* TO `majora`@`%`
  GRANT ALL PRIVILEGES ON `majora`.* TO `majora`@`%`
  ```
  Django's test runner has to `CREATE DATABASE test_majora`, and `majora` isn't allowed to.
- `.env` uses `MAJORA_MYSQL_USER=majora`, so `majora_tests` connects as `majora`.
- CircleCI (`.circleci/config.yml`) avoids the problem by running tests with `MAJORA_MYSQL_USER: root` against `cimg/mysql:8.0`. That's why CI passes and local runs don't.
- MySQL data is bind-mounted from `./docker_volumes/mysql_data`, so `docker-compose down` alone doesn't reset users or grants.
- Locally the image is MySQL 9.3.0, CI uses 8.0, and production runs 8.4.

### Scope

- **In scope:** the dev-stack MySQL setup, so local backend tests can create their test database the way CI does.
- **Out of scope:** the check-script exit code. `.claude/scripts/check_backend.sh` runs pytest under `set -euo pipefail`, so it already exits non-zero when pytest reports errors. The arcanum `run_checks.sh` wrapper passes that code through. The "exited 0 despite 8527 errors" seen while working on #1770 most likely came from the caller piping the output (e.g. `| tail`) without `pipefail`, not from a bug in the scripts. No change is planned for it here.

## Problem
Running the backend tests locally with the dev stack fails for almost every test:

```
MySQLdb.OperationalError: (1044, "Access denied for user 'majora'@'%' to database 'test_majora'")
```

`run_checks.sh backend` reported `563 passed, 8527 errors` while working on #1770. The errors happen during test database setup, so it's an environment problem and not a code problem: unrelated apps (staff, statistics, uploads, accounts) fail the same way.

This also happens after taking the whole stack down, so it isn't caused by stale local state.

## Expected Behavior
- Dev (`docker-compose.yml`) and CI (`.circleci/config.yml`) both use MySQL 8.4, matching production.
- On a fresh checkout and fresh `docker_volumes/mysql_data`, `docker-compose run --rm majora_tests poetry run pytest` runs with 0 database-setup errors.
- The local MySQL test setup matches CI's: same version, and root credentials for the test runner.
- `docker-compose run --rm majora_tests poetry run pytest` starts `majora_mysql` if needed, waits until it's healthy, and publishes no host port.
- `check_infra.sh` fails if any base `docker-compose.yml` service defines `ports:`.
- Docs explain that existing developers need to wipe `docker_volumes/mysql_data` after the version change.

## Solution
### Chosen approach

Point the `majora_tests` service at root credentials, the same way CI does: set `MAJORA_MYSQL_USER=root` in `majora_tests`' `environment:` block in `docker-compose.yml`. The password stays `majora`, which already matches `MYSQL_ROOT_PASSWORD` locally and in CI.

- Override it on the `majora_tests` service only. Don't change `.env` / `.env.dev.sample`, because `majora_app` must keep connecting as `majora`.
- **Why this option:** it's the only one that is fully backward compatible. The root user and password already exist in every existing `docker_volumes/mysql_data`, so developers don't need to wipe their data or run a one-off grant.
- **Rejected:** an init script under `/docker-entrypoint-initdb.d/` granting `test_majora` to `majora`. MySQL only runs these on an empty data dir, so existing developers would still hit error 1044 unless they wiped their data or ran a manual grant (a migration step that would need docs and a `make` target).
- **Rejected:** a Django `TEST` setting tweak on its own. It doesn't remove the need for `CREATE DATABASE` privileges.

### Alternatives considered

- Add an init script under `/docker-entrypoint-initdb.d/` that runs `GRANT ALL PRIVILEGES ON \`test_majora\`.* TO 'majora'@'%'`. It only takes effect on a fresh data dir.
- Or point the test container at root credentials (`MAJORA_MYSQL_USER=root` for `majora_tests`), the same way CI does.
- Or configure Django `TEST: {NAME: ...}` / grants so dev and CI behave the same.

### MySQL version alignment

Production already runs MySQL **8.4**. Use 8.4 everywhere so dev, CI and production all run the same version:

- `docker-compose.yml` → `majora_mysql`: `mysql:9.3.0` → a pinned `mysql:8.4.x` patch tag.
- `.circleci/config.yml`: `cimg/mysql:8.0` → a pinned `cimg/mysql:8.4.x` tag, in all three jobs (lines ~162, 195, 228). Check which `cimg/mysql` 8.4 tags exist.
- `.claude/agents/infra.md`: update the two version references (service table and the `pytest` CI job row).
- 8.4 disables `mysql_native_password` by default. Confirm the backend (`mysqlclient`) still connects with `caching_sha2_password`, both locally and in CI.

**Existing dev data dirs:** going from 9.3 to 8.4 is a downgrade, and MySQL can't start 8.4 on a data dir created by 9.3. No local dev data needs keeping, so a short docs note is enough, with no `make` target or dump/restore tooling. The note tells developers to wipe `docker_volumes/mysql_data` and rebuild it (migrations + `seed_dev_domains`).

### Edge cases

- **`majora_tests` doesn't start MySQL.** Today it only has `depends_on: base_build`, so with `majora_mysql` stopped (e.g. after `docker-compose down` or a data-dir wipe) every test fails with a connection error. A freshly wiped data dir also needs several seconds to initialise.
  - Add a `healthcheck` to `majora_mysql` (`mysqladmin ping` as root) and make `majora_tests` depend on it with `condition: service_healthy`.
- **Parallel test DBs:** `pytest-xdist` isn't used, so there's only `test_majora` and nothing to do. Root credentials would also cover `test_majora_gwN` if xdist is added later.
- **Leftover `test_majora` from an interrupted run:** pytest-django recreates it non-interactively, so nothing to do.
- **Shared server with dev data:** tests run as root on the same instance as the dev `majora` DB, but Django only touches `test_majora`. Dev data isn't at risk.

### Documentation

- Add a short note to the development section of `AGENTS.md` telling developers with an existing `docker_volumes/mysql_data` (created by 9.3) to wipe it and rebuild with `make setup` after this change.
- Update `.claude/agents/infra.md`: the MySQL image versions, the `majora_tests` → `majora_mysql` healthy dependency, and the root-credentials override for tests.

### Constraints

- **Tests must never publish host ports.** This is important so the backend tests can run in parallel with other projects' test suites on the same host. The new `healthcheck` / `depends_on` must be added to the base `docker-compose.yml` without any `ports:`. Host-port mappings stay only in the opt-in `docker-compose.ports.yml` (#1724), which test runs never load. The `majora_mysql` mapping there (used by `make dev-up`) stays as it is.
- No changes to production configuration: `.env.prod`, `base_prod` and `majora_prod_app` stay as they are (production is already on 8.4).

### Testing strategy

#### Automated

- `.claude/scripts/check_infra.sh` already runs `docker-compose config -q`, YAML-parses `.circleci/config.yml` and runs the full backend suite through `check_backend.sh`.
- **New guard in `check_infra.sh`:** fail if any service in the base `docker-compose.yml` defines `ports:` (e.g. `docker-compose config --format json` piped through a small `python3` filter). This keeps "tests never publish host ports" (#1724 and this issue) from quietly breaking later.
- **CI:** the three `pytest*` jobs must pass on `cimg/mysql:8.4.x`. This also confirms the backend connects under 8.4's default auth.

#### Manual (report the results in the PR)

1. **Fresh run:** `docker-compose down`, wipe `docker_volumes/mysql_data`, then run `docker-compose run --rm majora_tests poetry run pytest`. MySQL 8.4 starts on its own, the run waits until it's healthy, and there are 0 database-setup errors.
2. **No host port:** while the tests run, `docker port majora_mysql` prints nothing.
3. **Parallel-safe:** with another process already bound to host port 3306, the test run still works.
4. **Dev stack:** `make setup` + `make dev-up` work on 8.4. `majora_app` still connects as `majora` (not root), migrations and `seed_dev_domains` succeed, and phpMyAdmin works.

## Benefits
- Backend tests run locally exactly as in CI, so issue work can be verified before pushing.
- One MySQL version (8.4) in dev, CI and production removes a whole class of version-specific surprises.
- `majora_tests` starts and waits for its own database, so a cold stack or a fresh data dir works first time.
- Tests still publish no host ports (now guarded by `check_infra.sh`), so they can run in parallel with other projects' suites.
