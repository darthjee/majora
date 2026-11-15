# Edge Cases

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

The cases each sub-issue must handle. When a sub-issue handles one, it records how here.

## Transactional tests

10 test files use real transactions (`TransactionTestCase` or `django_db(transaction=True)`).
They must keep real transaction semantics: each one gets a justification comment (#1793), and
none is converted.

- **Concurrency** (`threading.Barrier`, committed rows must be visible across threads):
  `statistics/tests/middleware_test.py` (login burst), `statistics/tests/visit_tracking_test.py`,
  `accounts/tests/models/authorization_request_test.py`,
  `accounts/tests/authorization_requests/poll_test.py`.
- **Reset and clear:** `statistics/tests/reset_test.py`,
  `staff/tests/staff_statistics_clear_test.py`.
- **Migration:** `domains/tests/migrations/migrate_domain_title_test.py`,
  `accounts/tests/models/password_reset_token_table_migration_test.py`,
  `games/tests/models/character/character_public_slain_migration_test.py`,
  `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py`.

All 10 run in `pytest_all`. A transactional test flushes every table after each test, and a
migration test migrates the schema backwards and forwards; both are expensive on MySQL, so they
are a likely cause of `pytest_all` being the slowest job (hypothesis 1 in
[Cost drivers](cost-drivers.md#hypotheses)). The durations report (#1787) confirms or rules
this out, and the CI rebalancing (#1788) spreads them across jobs.

## History tests

- Application code does not read `simple_history` records at runtime; they are only exposed
  through `versioning/admin.py`. `GameDocumentPageHistory` is a custom model, not
  `simple_history`, so disabling `simple_history` does not affect it.
- 13 test files assert on history and need an explicit opt-in when history is turned off in
  tests (#1792): `common/tests/history_test.py`, `versioning/tests/historical_records_test.py`,
  `accounts/tests/models/password_reset_token_history_test.py`,
  `accounts/tests/models/authorization_request_test.py`,
  `staff/tests/staff_copies_documents_test.py`, `games/tests/models/copied_from_test.py`,
  `games/tests/models/game/game_document_page_history_test.py`,
  `games/tests/models/game/game_recipe_test.py`, two recipe detail PATCH view tests (PC and
  NPC) and three game document page view tests.
- The opt-in must restore the disabled state afterwards, so one test cannot leave history
  enabled for the next.
- History stays **on** in production: only `settings_test.py` turns it off, through the switch
  `django-simple-history` 3.13.0 offers (#1792 checks which), never by patching models.
  `HistoryRequestMiddleware` stays in place.

## Shared in-memory cache

- `memory_cache` is a process-wide module object (`majora_project/cache/__init__.py`), cleared
  by hand in only 16 test files.
- Adding an autouse clear fixture (#1789) can change outcomes: a test that passes today only
  because an earlier test warmed the cache starts failing. Those failures are real bugs in the
  test and are fixed in the same PR, not worked around.
- Autouse pytest fixtures also run for Django `TestCase` classes under pytest, so a single
  fixture covers both isolation patterns.

## Shared-scope setup

- With `setUpTestData`, database changes are rolled back after the class and in-memory
  attributes are deep-copied per test, so a test that mutates a shared object does not leak.
- A class-, module- or session-scoped pytest fixture that writes to the database (through
  `django_db_blocker`) is **not** rolled back per test: data created or changed by one test leaks
  into the next. The [Isolation policy](isolation-policy.md#fixture-scope) forbids it, and the
  check script enforces it from #1793 on.

## Factories

- `TokenFactory` (#1790) must generate a unique `key` per token, and its default must keep
  producing a valid token for an approved user.
- Making the `UserProfile` attachment in `UserFactory` optional (#1791) must keep **approved** as
  the default. Tests that hit the approval gate would otherwise start failing with permission
  errors. Skipping the profile is an explicit opt-out.

## `--reuse-db`

- A reused local database does not pick up new migrations automatically. The documented local
  command (#1794) must say when to pass `--create-db` (after pulling or writing migrations).
- CI always passes `--create-db`, so `--reuse-db` does not change what CI runs.

## Tests without a database

A new test file that never touches the database uses a plain pytest class with no marker, not
`TestCase`, so it pays no database setup.

## Branches written to the old instructions

Pull requests already in flight when #1786 lands may still add `@pytest.mark.django_db` +
`setup_method` test files. This is accepted: they are not converted retroactively, and the next
re-count in [Conversions](conversions.md) simply includes them.

## Test identity

- Converting a module to `TestCase` may rename test classes or tests (for example parametrized
  tests turned into `subTest`). Each conversion PR lists the renamed tests, so collected test
  sets can still be compared (see [Verification](verification.md)).
- If CI uses timing-based splitting (#1788), renamed tests lose their timing history until the
  next run. This is acceptable.
