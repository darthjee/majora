# Isolation Policy

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

How backend tests isolate their database state. This page holds the rules only, so #1795 can
move it into `docs/agents/testing.md` almost unchanged. Edge cases behind each rule live in
[Edge cases](edge-cases.md).

## New tests

- **New test files that touch the database** use Django `TestCase`. Data every test needs is
  built once per class in `setUpTestData` (a `@classmethod`), never in `setup_method` or
  `setUp`.
- **New test files with no database access** (pure unit tests) use plain pytest classes with no
  marker, not `TestCase`, so they pay no database setup.
- **New tests added to an existing file** follow that file's existing style, so files are not
  mixed.

## Existing pytest-style tests

- Existing `@pytest.mark.django_db` + `setup_method` files keep their style when tests are added
  or edited in them.
- They first get the cheap fixes: the cache fixture (#1789), `TokenFactory` (#1790), the
  optional `UserProfile` (#1791) and history off (#1792).
- They are converted to `TestCase` only by the dedicated module conversion sub-issues, only for
  modules the durations report shows as slow, slowest first, one module or app per PR. A module
  is never converted just because it was touched for another reason.
- Modules that depend on `@pytest.mark.parametrize` either stay in pytest style or switch to
  `self.subTest` (or separate methods) during conversion. The conversion PR states which.

## Transactions

- Real transactions (`TransactionTestCase`, `@pytest.mark.django_db(transaction=True)`) are used
  only when the test needs committed data (threads, migrations).
- Each one has a comment directly above it saying why.

## Fixture scope

- Database-writing fixtures scoped to a class, module or session are **forbidden**: they are not
  rolled back between tests, so data leaks from one test into the next.
- Shared data is built in `setUpTestData` instead, which is rolled back after the class and
  deep-copied per test.

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

- An autouse fixture (`clear_memory_cache` in `backend/conftest.py`) clears `memory_cache` before
  each test (#1789). Tests never call `memory_cache.clear()`, except a test whose subject is
  clearing, marked `# test-policy: allow memory-cache-clear`. `bin/check_test_policy.py` enforces it.
- Cache warmed in `setUpTestData`/`setUpClass` is cleared before each test, so a test that needs it
  builds or primes its own state.

## Rules added later

*Placeholders, filled in by the sub-issue named.*

- **Tokens (#1790):** tests create tokens with `TokenFactory`, never `Token.objects.create`.
- **History (#1792):** `simple_history` is off in tests; tests that assert on history use the
  opt-in.
- **Base object graph (#1793):** `setUpTestData` builds the common game, player, user and domain
  through the shared `base_game` builder.

## Why

Today's pytest-style tests depend heavily on pytest features (the `client` fixture,
`@pytest.mark.parametrize`, `monkeypatch`, `django_assert_num_queries`). Options considered:

- **A. Convert everything to `TestCase` + `setUpTestData`.** Rejected: rewriting hundreds of
  files, including parametrized ones, before measuring is high risk, and the baseline showed the
  cost is not where it was assumed.
- **B. Stay in pytest style with a class- or module-scoped fixture that opens
  `transaction.atomic()` through `django_db_blocker` and rolls back at the end.** Rejected: it
  rebuilds `TestCase` on top of pytest-django internals and does not deep-copy shared in-memory
  objects per test, so mutations leak between tests.
- **C. Keep per-test setup and only make it cheaper.** Kept as the first step, not the end
  state: low risk, but limited savings.
- **D. Hybrid, measurement-driven.** **Chosen:** new tests use `TestCase` + `setUpTestData`,
  existing modules get the cheap fixes first, and only the modules measured as slow are
  converted, one per PR.
