# Issue: Fix long running Python tests in CI

## Description
The Python/Django backend test suite (`source/games/tests`, `source/versioning/tests`) takes 10-20 minutes to run on CI. This issue documents the investigated root causes and proposes a fix.

## Problem
Investigation (backend + infra) found the CI test run time (10-20 min across 3 parallel jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all` in `.circleci/config.yml`) is caused by several compounding factors, not a single "database recreation" issue:

- **Redundant migration pass per job**: `source/bin/configure_database.sh:21-24` runs `manage.py migrate` against the `majora` DB before pytest starts. But pytest-django then creates its own `test_majora` DB and re-runs all ~42 migrations from scratch anyway (no `--reuse-db`/`--no-migrations` flag in `source/pyproject.toml:27-31` or the CI pytest invocations). The first `migrate` step's result is never used by the tests — it's pure duplicated work, x3 CI jobs.
- **Slow password hashing in tests**: `source/majora_project/settings.py` has no `PASSWORD_HASHERS` override for tests, so ~279 call sites across `source/games/tests` that create users via `create_user`/`UserFactory`/`SuperUserFactory` (`source/games/tests/factories.py:19-32`) each pay full `PBKDF2PasswordHasher` cost (~100-300ms/hash). This is multiplied further because 94 test files use `setup_method` (runs before every single test) rather than class-level `setUpTestData`.
- **Per-test DB setup instead of per-class**: 94 of ~108 test files use `setup_method` to build fixture data before each test method, instead of reusing data across a test class via `setUpTestData`. Combined with `django-simple-history` on all 9 models (every `.save()` also writes a historical record row), this multiplies DB writes for every test run.

## Expected Behavior
The backend test suite runs meaningfully faster in CI, without any loss of test coverage or reliability.

## Solution
Based on the root-cause analysis, apply the following fixes (ordered by effort):

1. **Drop the redundant migration step** — remove (or no-op) the standalone `manage.py migrate` call in `source/bin/configure_database.sh` / CI setup, since pytest-django already migrates its own test database from scratch. This alone removes a full duplicate migration pass per CI job.
2. **Use a fast password hasher in tests** — add a test-only `PASSWORD_HASHERS` override (e.g. `django.contrib.auth.hashers.MD5PasswordHasher`) via pytest/Django test settings, so the ~279 `create_user`/factory call sites stop paying full PBKDF2 cost.
3. **Refactor `setup_method` to `setUpTestData` where safe** — across the ~94 affected test files, move fixture/object creation that doesn't need to be re-created per test method into class-level `setUpTestData`, reducing redundant DB writes (including the doubled `django-simple-history` writes) per test run.

Out of scope for this issue (flagged during investigation but not included): disabling `django-simple-history` during tests, and adding `pytest-xdist` for intra-job parallelization — these can be tracked as separate follow-up issues if still relevant after the above fixes land.

## Benefits
- Faster CI feedback loop for backend changes (target: meaningfully under the current 10-20 minutes).
- Removes clearly wasted work (duplicate migrations) with no behavior change risk.
- Faster local test runs too, since the password hasher and `setUpTestData` changes apply outside CI as well.
