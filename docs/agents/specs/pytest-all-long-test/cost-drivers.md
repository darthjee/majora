# Cost Drivers

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

What makes the suite slow, as observed before any change, and the hypotheses ranking them.
Counts are a snapshot taken when the Epic was written; [Conversions](conversions.md) holds the
recorded test-style counts.

## Context

- Root `backend/conftest.py` only sets `DJANGO_SETTINGS_MODULE`. There is no shared fixture, no
  autouse cleanup and no session-scoped object graph.
- `backend/majora_project/settings_test.py` only overrides `PASSWORD_HASHERS` to
  `MD5PasswordHasher`.
- `backend/pyproject.toml` `[tool.pytest.ini_options]` defines `DJANGO_SETTINGS_MODULE`,
  `pythonpath`, `testpaths` (11 apps) and `python_files`. It does **not** define `addopts`,
  `--reuse-db`, `--no-migrations` or any xdist configuration.
- Each CI pytest job has its own ephemeral `cimg/mysql:8.4.13` container, so creating the test
  database per job is cheap and is **not** the bottleneck.
- `django-simple-history` 3.13.0 is installed and `HistoryRequestMiddleware` is active, so every
  `save()` on a versioned model writes an extra history row during tests.

## Observed cost drivers

1. **No central isolation policy.** Django `TestCase` + `setUpTestData` (one transaction per
   class, cached fixtures) and `@pytest.mark.django_db` + `setup_method` (setup re-run for every
   test) coexist, undocumented and unmeasured. Converting between them changes transaction
   semantics, so it must be incremental and per module. Addressed by the
   [Isolation policy](isolation-policy.md) and the module conversions.
2. **Per-test setup instead of per-class setup.** For example,
   `games/tests/views/games/games_list_test.py` creates its domain and clears the cache in
   `setup_method`, so every test repeats that `INSERT`. 360 test files define `setup_method`.
   Addressed by the module conversions and the `base_game` builder (#1793).
3. **`UserFactory` writes two rows per user.** `games/tests/factories/user.py` calls
   `manager.create_user(...)` (with a password hash) and then `_ensure_approved_profile(user)`,
   for every authenticated test. Addressed by #1791.
4. **No `TokenFactory`.** Tests create tokens by hand with `Token.objects.create(user=...)`:
   1,337 call sites. Addressed by #1790.
5. **No reuse of the base object graph.** Each module rebuilds its game, player, user and domain
   per test. Addressed by #1793 and the module conversions.
6. **Manual `memory_cache.clear()`.** The in-memory cache (`majora_project/cache/__init__.py`)
   is process-wide. Only 16 test files clear it by hand; a test that forgets can pass or fail
   depending on what ran before it. Addressed by #1789.
7. **`simple_history` writes during tests.** Every save of a versioned model writes an extra
   history row, which only 13 test files assert on. Addressed by #1792.
8. **Coverage always on.** All three CI jobs run with `--cov`, and there is no fast local
   command without it. Addressed locally by #1794 (`make tests-fast`).
9. **Transactional and migration tests.** 10 test files use real transactions
   (`TransactionTestCase` or `django_db(transaction=True)`), and 4 of them are migration tests.
   All 10 run in `pytest_all`. Flushing every table after each test and migrating the schema back
   and forth are both expensive on MySQL. See [Edge cases](edge-cases.md#transactional-tests).

## Hypotheses

Ordered by expected impact. Each one is confirmed or ruled out mainly by the durations report
(#1787). The sub-issue that settles a hypothesis updates its status here.

| # | Hypothesis | Status | How it is confirmed or ruled out |
|---|------------|--------|----------------------------------|
| 1 | The transactional and migration tests in `pytest_all` (driver 9) are a large share of its runtime. Suggested by the baseline: `pytest_all` has no view tests, yet it is the slowest job. | **confirmed** | Sum of the durations of the 10 transactional files in #1787's `pytest_all` report, against the job's total. Pipeline 5900: the 10 files take 244.41s, 57.3% of the job's 426.84s sum of test times (53.2% of its 459.63s pytest wall time). The 4 migration files take 232.93s (54.6%), and two of them (`game_treasure_hidden_backfill_migration_test.py`, `character_public_slain_migration_test.py`) take 223.83s (52.4%); the 6 concurrency and reset/clear files only 11.48s (2.7%). See [Baseline](baseline.md#first-durations-report). |
| 2 | The three pytest jobs are unbalanced, so the pipeline waits on the largest one regardless of per-test cost. | open | Already visible in the [Baseline](baseline.md); confirmed when #1788's rebalanced jobs lower the workflow wall-clock time without changing any test. |
| 3 | Per-test setup (driver 2) multiplied across the suite is a major cost. The baseline weakens the original ranking of view tests first, since they run in the two faster jobs. | **confirmed** | #1787's report: share of time spent in setup for `setup_method` modules; then the before/after time of each module conversion. Pipeline 5900, excluding the one-off test database creation: the 360 `setup_method` files spend 152.09s in setup against 131.34s in call across the three jobs (all other files: 6.37s of setup). It is the largest cost of `pytest_views_characters` (85.07s setup vs 64.17s call, 226.5s pytest wall time), but not of the critical-path `pytest_all` (49.44s), which is dominated by hypothesis 1. Module conversions keep their before/after times in the [Baseline](baseline.md#history). |
| 4 | `UserFactory` and manual `Token` creation multiply `INSERT`s across the suite. | open | Before/after job times of #1790 and #1791. |
| 5 | `simple_history` roughly doubles write volume on versioned models. | open | Before/after job times of #1792. |
| 6 | Coverage instrumentation adds a substantial constant overhead to every run. | open | #1794's local runs with and without `--cov` on the same machine. |
| 7 | The lack of `--reuse-db` adds a fixed setup cost to every local run (local only, not CI). | open | #1794's local before/after runs. |

Statuses are **open**, **confirmed** or **ruled out**. A confirmed or ruled-out hypothesis
keeps its row, with the evidence (pipeline, report or PR) added to the last column.
