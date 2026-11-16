# Backend Testing

The permanent reference for how backend tests are written, isolated, run locally and split in CI.
It comes from Epic #1785 (backend tests speed). Tests live in `backend/<app>/tests/`, named
`<module>_test.py`.

## New tests

- **New test files that touch the database** use Django `TestCase`. Data every test needs is
  built once per class in `setUpTestData` (a `@classmethod`), never in `setup_method` or
  `setUp`.
- **New test files with no database access** (pure unit tests) use plain pytest classes with no
  marker, not `TestCase`, so they pay no database setup.
- **New tests added to an existing file** follow that file's existing style, so files are not
  mixed.
- **Base object graph:** `setUpTestData` builds the common game, player, user and domain through
  the shared `build_base_game` builder (`games/tests/factories/base_game.py`):

  ```python
  from games.tests.factories import build_base_game

  class TestSomething(TestCase):
      @classmethod
      def setUpTestData(cls):
          cls.base = build_base_game()  # game, dm_user, dm_player, domain
  ```

  Overrides: `game_name`, `game_slug`, `dm_username`, plus any other `Game` field as a keyword.
  The domain is always `testserver` and `Domain.domain` is unique, so use `base.domain` rather
  than creating another one.

## Existing pytest-style tests

- Existing `@pytest.mark.django_db` + `setup_method` files keep their style when tests are added
  or edited in them.
- They are converted to `TestCase` only by dedicated issues, only for modules the durations
  report shows as slow, slowest first, one module or app per PR. A module is never converted just
  because it was touched for another reason.
- Modules that depend on `@pytest.mark.parametrize` either stay in pytest style or switch to
  `self.subTest` (or separate methods) during conversion. The conversion PR states which and lists
  any renamed tests.

## Transactions

- Real transactions (`TransactionTestCase`, `@pytest.mark.django_db(transaction=True)`) are used
  only when the test needs committed data (threads, migrations, raw DDL).
- Each one has a `# transactional: <reason>` comment directly above it saying why; the
  `transaction-justification` rule of the check script enforces it.
- Transactional tests flush every table after each test, and migration tests migrate the schema
  backwards and forwards. Both are expensive on MySQL, so they are never converted. They fall in
  three groups: concurrency (`threading.Barrier`, threads use their own connections and must see
  committed rows), reset and clear (raw `ALTER TABLE` commits implicitly on MySQL) and migration
  (`MigrationExecutor`, DDL commits implicitly on MySQL).

## Fixture scope

- Database-writing fixtures scoped to a class, module, package or session are **forbidden**:
  they are not rolled back between tests, so data leaks from one test into the next.
- Shared data is built in `setUpTestData` instead, which is rolled back after the class and
  deep-copied per test, so a test that mutates a shared object does not leak.
- The `scoped-db-fixture` rule of the check script flags such a fixture (one that takes or uses
  `django_db_blocker`).

## Inside `TestCase`

| pytest style | `TestCase` equivalent |
|--------------|-----------------------|
| `client` fixture | `self.client` |
| `monkeypatch` | `unittest.mock.patch` |
| `django_assert_num_queries` | `self.assertNumQueries` |
| `@pytest.mark.parametrize` (not supported in `TestCase`) | `self.subTest` or separate methods |

- Plain `assert` is still used (it works inside `TestCase` under pytest); no `unittest`
  `assert*` methods, except the `assertNumQueries` context manager.
- Each test method has a one-line docstring.

## Cache

- `memory_cache` is a process-wide module object (`majora_project/cache/__init__.py`). An autouse
  fixture (`clear_memory_cache` in `backend/conftest.py`) clears it before each test. It also runs
  for `TestCase` classes under pytest, so one fixture covers both isolation patterns.
- Tests never call `memory_cache.clear()`, except a test whose subject is clearing, marked
  `# test-policy: allow memory-cache-clear`.
- Cache warmed in `setUpTestData`/`setUpClass` is cleared before each test, so a test that needs
  it builds or primes its own state. A test that passes only because an earlier test warmed the
  cache is a bug in the test and is fixed there.

## Factories

- **Tokens:** tests and helper modules create tokens with `TokenFactory`
  (`games/tests/factories/token.py`), never `Token.objects.create`. It generates a unique `key` per
  token and keeps producing a valid token for an approved user. Opt-out:
  `# test-policy: allow token-create`.
- **Users:** `UserFactory(with_profile=False)` skips the `UserProfile` row. The default stays
  **approved**, so tests that hit the approval gate keep working. Use the opt-out only for users
  that never authenticate (no login, token, `force_authenticate` or `ApiToken`) and whose profile
  the endpoint under test does not read; a profile-less user that authenticates is treated as
  anonymous because `is_approved()` creates a `pending` profile.

## History

`simple_history` recording is off in tests (`SIMPLE_HISTORY_ENABLED = False` in
`majora_project/settings_test.py`); it stays on in production, and `HistoryRequestMiddleware`
stays in place. A test that reads `simple_history` rows, or asserts that none were added, uses
`@pytest.mark.history` on the test or class. An autouse fixture (`simple_history_recording` in
`backend/conftest.py`) turns recording back on for it and restores the disabled state afterwards,
so one test cannot leave history enabled for the next. `GameDocumentPageHistory` is a custom model
and is unaffected.

## Check script

`backend/bin/check_test_policy.py` (standard library only) scans every `.py` file under the pytest
`testpaths` (test files, conftests and helper modules) plus the root `conftest.py`. It runs in the
`checks` CI job (`poetry run python bin/check_test_policy.py`). Output lines look like
`path:line: rule-id: message`; exit code `1` means violations, `2` a configuration error.

| Rule | Forbids | Opt-out comment |
|------|---------|-----------------|
| `memory-cache-clear` | `memory_cache.clear()` in tests (the autouse fixture handles it) | `# test-policy: allow memory-cache-clear` |
| `token-create` | `Token.objects.create` (use `TokenFactory`) | `# test-policy: allow token-create` |
| `transaction-justification` | a `TransactionTestCase` or `django_db(transaction=True)` without a `# transactional: <reason>` comment directly above | add the `# transactional: <reason>` comment |
| `scoped-db-fixture` | a class/module/package/session fixture that uses `django_db_blocker` | `# test-policy: allow scoped-db-fixture` |

Allowed lines are printed as opt-outs, not failures. "New tests use `TestCase` +
`setUpTestData`" is **not** enforced by the script, because telling new test files from old ones is
fragile; it is enforced through the backend agent instructions and code review.

## Running tests locally

Always through Docker, never on the host:

```bash
docker-compose run --rm majora_tests pytest
make tests-fast            # reuses the test database, no coverage
make tests-fast ARGS=common/tests
```

- `backend/pyproject.toml` sets `addopts = "--reuse-db"`, so a local `pytest` and `make tests-fast`
  reuse `test_majora`.
- All worktrees share the `majora_mysql` container and its `test_majora`, so a reused database can
  carry another branch's schema, and it does not pick up new migrations automatically. Pass
  `--create-db` after pulling or writing migrations, after switching to a branch with different
  migrations, and after an interrupted migration test.
- `.claude/scripts/check_backend.sh` always passes `--create-db` (then runs `ruff check`), so an
  agent's check runs against the schema of its own branch. CI also always passes `--create-db`.

## CI

Two jobs in `.circleci/config.yml`, each with `parallelism: 3` and its own `cimg/mysql:8.4.13`
container per parallel container:

| Job | Scope | Split |
|-----|-------|-------|
| `pytest_views` | every `*_test.py` under `games/tests/views/` | by recorded timings |
| `pytest_non_views` | every other `*_test.py` under the `testpaths` | by recorded timings |

- Both run a "Split test files" step through the shared `split_test_files` command. It globs the
  `*_test.py` files of every `testpaths` entry in `backend/pyproject.toml`, keeps the `include`
  regex and drops the `exclude` regex, pipes the list to `circleci tests split --split-by=timings
  --timings-type=filename`, fails if the container's share is empty, writes it to
  `test-reports/test-files.txt` and exports it as `TEST_FILES`.
- Both run pytest through the `pytest_with_reports` command, which adds `--cov
  --cov-report=lcov:coverage/lcov.info --durations=0 --junitxml=test-reports/junit.xml -o
  junit_family=xunit1`. `xunit1` adds the `file` attribute that timing-based splitting needs.
- Each container uploads its own partial coverage to Codacy ("Upload coverage to Codacy
  (partial)"); `coverage-final` requires both pytest jobs. A new or renamed pytest job must keep
  uploading coverage, and `coverage-final` and every tag-only release job must require it.
- Tests are never changed to balance the split. Some behavior modules (`_*_behavior.py`) define
  tests that other files inherit; JUnit credits them to the defining module, so the split is less
  even than it looks. This is accepted.

### Durations report

Every pytest container publishes, under `test-reports/` in the job's **Artifacts** tab:

| File | Content |
|------|---------|
| `pytest-output.txt` | The full pytest console output. |
| `durations.txt` | The `--durations=0` list: one line per phase (`setup`, `call`, `teardown`) of each test, slowest first. |
| `durations-by-file.md` | Per-file and per-directory totals built from the JUnit XML by `bin/junit_summary.py`. |
| `junit.xml` | The JUnit XML (xunit1). |
| `test-files.txt` | The test files given to this container; the union over all containers is the full suite. |

Reading them:

- `durations-by-file.md` starts with the test count, the sum of test times and the suite wall time,
  then two tables sorted by total time (per file and per directory) with count, seconds, share and
  average. A test's JUnit time includes setup, call and teardown. This is the report that decides
  which modules are worth converting to `TestCase`.
- In `durations.txt`, a large `setup` points at fixtures, `setup_method`/`setUp` or database work;
  a large `call` points at the test body.
- The gap between the job duration and the suite wall time is the job overhead (container start,
  `poetry install`, waiting for MySQL, coverage upload).

Run the summary locally, inside the `majora_tests` container only:

```bash
docker-compose run --rm majora_tests sh -c "poetry run pytest common/tests \
  --junitxml=/tmp/junit.xml -o junit_family=xunit1 -q \
  && poetry run python bin/junit_summary.py /tmp/junit.xml /tmp/durations-by-file.md \
  && cat /tmp/durations-by-file.md"
```

Usage: `python bin/junit_summary.py <junit.xml> <output.md>`. It exits non-zero only when the input
is missing or unreadable.

## Why this policy

Options considered when the policy was set:

- **A. Convert everything to `TestCase` + `setUpTestData`.** Rejected: rewriting hundreds of
  files, including parametrized ones, before measuring is high risk.
- **B. Stay in pytest style with a class- or module-scoped fixture that opens
  `transaction.atomic()` through `django_db_blocker`.** Rejected: it rebuilds `TestCase` on top of
  pytest-django internals and does not deep-copy shared in-memory objects per test.
- **C. Keep per-test setup and only make it cheaper.** Kept as the first step, not the end state.
- **D. Hybrid, measurement-driven.** **Chosen:** new tests use `TestCase` + `setUpTestData`,
  existing modules get the cheap fixes, and only modules measured as slow are converted, one per PR.
