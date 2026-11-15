# Issue: Backend test suite is slow: unify test isolation and remove per-test setup cost

## Description

**This issue is an Epic.** The backend pytest suite is slow. CI's critical path is the `pytest_all` job at **8m 34s**. An earlier attempt assumed the test database was being dropped on every run; that was fixed, but the suite is still slow.

The suite has **no single test isolation policy**. Two incompatible patterns coexist: Django `TestCase` with `setUpTestData` (193 files: one transaction per class, cached fixtures) and `@pytest.mark.django_db` on plain classes with `setup_method` (387 files: setup re-run for every test). The second pattern is what `.claude/agents/backend.md` currently tells agents to write, so every new test adds to the cost.

The Epic first writes a spec (`docs/agents/specs/pytest-all-long-test.md` plus aspect pages) from this issue's content. Then it delivers a series of measured, low-risk sub-issues: CI rebalancing, a durations report, cheaper factories and fixtures, and module conversions driven by measurement. Finally it removes the spec once the lasting knowledge has moved into the permanent docs (`docs/agents/testing.md`).

### Target

Both CI wall-clock time and the local feedback loop are targets, with **CI first**.

- **Order:** the sub-issue order above stands. CI rebalancing (2) and the durations report (3) come first. The per-test cost work (4 to 8) benefits both targets.
- **Local work runs in parallel:** sub-issue 9 (`--reuse-db`, `make tests-fast`) changes no test, so it can be done alongside the others instead of waiting for 4 to 8.
- **Local baseline:** the specs sub-issue (1) records a local baseline next to the CI numbers in `baseline.md`: a full run in the `majora_tests` container, both with and without `--cov`, on a stated machine.
- **Success** is measured against both baselines: the CI workflow wall-clock time (currently about 8m 43s, driven by `pytest_all` at 8m 34s) and the local full-run time. Concrete numeric targets are set in `baseline.md` once the durations report (3) is available.

## Problem

### Baseline measurements

Recorded from CircleCI pipeline 5881 (workflow `e2f98440-57eb-497c-99cc-eb548b62991d`), 2026-11-15:

| Job | Scope (`.circleci/config.yml`) | Duration |
| --- | --- | --- |
| `pytest_all` (#95739) | `pytest --ignore=games/tests/views/` | **8m 34s** |
| `pytest_views_characters` (#95741) | `pytest games/tests/views/game/` | 5m 04s |
| `pytest_views_rest` (#95737) | `pytest games/tests/views/ --ignore=games/tests/views/game/` | 3m 35s |

Every other job in the workflow finishes in under one minute, so `pytest_all` is the critical path of the whole pipeline: the workflow wall-clock time is about 8m 43s, and `coverage-final` waits on it.

Observations:

- `pytest_all` excludes `games/tests/views/` entirely, yet it is the slowest job. This contradicts hypothesis 1 (view tests with `setup_method` are the dominant cost), or at least shows the non-view tests are the bigger bottleneck for CI wall-clock time.
- The job name `pytest_views_characters` is misleading: it runs `games/tests/views/game/`, not character views.
- The three jobs are unbalanced (8m 34s vs 5m 04s vs 3m 35s). Rebalancing them is a cheap way to reduce wall-clock time without changing any test.

### Context

- Root `backend/conftest.py` contains only three lines: it sets `DJANGO_SETTINGS_MODULE`. There is no shared fixture, no autouse cleanup, no session-scoped object graph.
- `backend/majora_project/settings_test.py` overrides only `PASSWORD_HASHERS` to `MD5PasswordHasher`.
- `backend/pyproject.toml` `[tool.pytest.ini_options]` defines `DJANGO_SETTINGS_MODULE`, `pythonpath`, `testpaths` (11 apps) and `python_files`. It does **not** define `addopts`, `--reuse-db`, `--no-migrations`, or any xdist configuration.
- `.circleci/config.yml` runs three separate pytest jobs (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`), each with its own ephemeral `cimg/mysql:8.0` container. Database creation per job is therefore cheap and is **not** the bottleneck.
- `docker-compose.yml` defines `majora_tests`, which starts `majora_mysql` with a healthcheck and connects as root so it can create `test_majora`. The MySQL data volume persists on the host under `docker_volumes/mysql_data`.
- `django-simple-history` 3.13.0 is installed and its `HistoryRequestMiddleware` is active, so every `save()` on a versioned model writes an extra history row during tests.
- `.claude/agents/backend.md` (Tests section) tells agents to decorate test classes with `@pytest.mark.django_db` and to use `setup_method` for per-test fixtures.

### Observed cost drivers

1. **No central isolation policy.** The two patterns above coexist, undocumented and unmeasured. Converting between them changes transaction semantics, so it must be incremental and per module, never one large pull request.
2. **Per-test setup instead of per-class setup.** For example, `games/tests/views/games/games_list_test.py` creates its domain and clears the cache in `setup_method`, so every test in the class repeats that `INSERT`. With `setUpTestData` it would run once per class. 360 test files define `setup_method`.
3. **`UserFactory` writes two rows per user.** `games/tests/factories/user.py` calls `manager.create_user(...)` (with a password hash) and then `_ensure_approved_profile(user)`, for every authenticated test.
4. **No `TokenFactory`.** Tests create tokens by hand with `Token.objects.create(user=...)`: 1,337 call sites.
5. **No reuse of the base object graph.** Each module rebuilds its game, player, user and domain per test.
6. **Manual `memory_cache.clear()`.** The in-memory cache (`majora_project/cache/__init__.py`) is process-wide. Only 16 test files clear it by hand; a test that forgets can pass or fail depending on what ran before it.
7. **`simple_history` writes during tests.** Every save of a versioned model writes an extra history row, which only 13 test files assert on.
8. **Coverage always on.** All three CI jobs run with `--cov`, and there is no fast local command without it.
9. **Transactional and migration tests.** 10 test files use real transactions (`TransactionTestCase` or `django_db(transaction=True)`), and 4 of them are migration tests. All 10 run in `pytest_all`. Flushing every table after each test and migrating the schema back and forth are both expensive on MySQL.

### Hypotheses, ordered by expected impact

Each hypothesis is confirmed or ruled out by the durations report (sub-issue 3).

1. The transactional and migration tests in `pytest_all` (cost driver 9) are a large share of its runtime. This is suggested by the baseline: `pytest_all` contains no view tests, yet it is the slowest job.
2. The three pytest jobs are unbalanced, so the pipeline waits on the largest one regardless of per-test cost.
3. Per-test setup (cost driver 2) multiplied across the suite is a major cost. The original issue ranked view tests first; the baseline weakens that, since view tests run in the two faster jobs.
4. `UserFactory` and manual `Token` creation multiply `INSERT`s across the suite.
5. `simple_history` roughly doubles write volume on versioned models.
6. Coverage instrumentation adds a substantial constant overhead to every run.
7. The lack of `--reuse-db` adds a fixed setup cost to every local run (a local problem, not a CI problem).

## Expected Behavior

When the Epic is complete:

- The CI workflow wall-clock time and the local full-run time are both measurably lower than the baselines recorded in `baseline.md`, and the before and after numbers are stated on the Epic.
- A durations report is published for every pytest job.
- The CI pytest jobs are balanced, and their names match what they run.
- A written isolation policy exists in `docs/agents/testing.md`, is referenced from `AGENTS.md` and from the backend agent instructions, and the check script keeps it enforced.
- Every `TransactionTestCase` or `django_db(transaction=True)` has a justification comment.
- No database-writing fixture is scoped to a class, module or session.
- No test file clears `memory_cache` by hand; an autouse fixture does it.
- `TokenFactory` exists, and no test file calls `Token.objects.create`.
- `simple_history` is off in tests by default, with an opt-in for the tests that assert on history, and stays on in production.
- A documented fast local command runs without coverage (`make tests-fast`).
- The spec files under `docs/agents/specs/pytest-all-long-test*` are removed.

## Solution

### Epic structure

This issue is an **Epic**. It follows the same pattern as the Statistics Bug Epic (#1696): the first sub-issue writes a spec that every later sub-issue follows, and the last sub-issue removes that spec once the knowledge has moved into the permanent docs (see [Specs](../specs.md)).

#### Spec location

- Hub page: `docs/agents/specs/pytest-all-long-test.md`, registered in `docs/agents/specs.md` under "Active specs".
- Aspect pages: `docs/agents/specs/pytest-all-long-test/*.md`.
- Names use kebab-case to match the existing specs (`statistics-bug`, `loot-crawling`).

Proposed aspect pages, built from the sections of this issue:

- `baseline.md`: the CI timings above, and how before/after runtime is measured.
- `cost-drivers.md`: the observed cost drivers and the hypotheses, each with how it is confirmed or ruled out.
- `isolation-policy.md`: the target test isolation pattern (the draft of the future `docs/agents/testing.md`), including when `TransactionTestCase` is allowed.
- `ci-jobs.md`: how the pytest jobs are split and balanced in CircleCI, and the durations artifact.
- `plan.md`: the sub-issue order and map, and the definition of done.

#### Sub-issue order

Draft list, to be refined by `/arcanum-split-issue`. Items 2 and 3 come first because they are cheap and do not change test behaviour. Items 4 to 9 target whatever the durations report shows to be slow, not only `games/tests/views/`.

| # | Sub-issue | Spec page(s) |
| --- | --- | --- |
| 1 | **Write the specs.** Create the hub and aspect pages from this issue's content, including the `TestCase` vs `@pytest.mark.django_db` counts per app, and the local baseline. Also update the Tests section of `.claude/agents/backend.md` and `.github/agents/backend.agent.md` to point at `isolation-policy.md` (see Backward compatibility). No code or test changes. | all |
| 2 | Rebalance the CI pytest jobs: split `pytest_all` (or use CircleCI `parallelism` with timing-based splitting) and rename `pytest_views_characters` to match what it runs. | `ci-jobs.md`, `baseline.md` |
| 3 | Publish a `--durations` artifact for every pytest job. | `ci-jobs.md`, `baseline.md` |
| 4 | Add an autouse fixture that clears `memory_cache` and remove the manual calls (16 files). | `isolation-policy.md` |
| 5 | Add `TokenFactory` and replace manual `Token.objects.create` calls (1,337 call sites; may be split further per app). | `cost-drivers.md` |
| 6 | Make the `UserProfile` attachment in `UserFactory` optional. | `cost-drivers.md` |
| 7 | Disable `simple_history` in tests, with an opt-in for the 13 test files that assert on history. | `cost-drivers.md` |
| 8 | Convert slow test modules to Django `TestCase` + `setUpTestData` (with a shared `base_game` builder called from `setUpTestData`, never a database-writing fixture scoped to a class, module or session), one module or app per PR, starting with the slowest in the durations report. Add justification comments to the 10 existing transactional test files. | `isolation-policy.md` |
| 9 | Local ergonomics: `--reuse-db` locally, `--create-db` in CI, and a `make tests-fast` target without coverage. | `baseline.md` |
| 10 | Evaluate `pytest-xdist`, only if still needed after 4 to 8. | `ci-jobs.md` |
| 11 | **Remove the specs.** | all |

Item 11 detail: **Remove the specs.** Move the lasting knowledge into the permanent docs (`docs/agents/testing.md`, `AGENTS.md`), delete `docs/agents/specs/pytest-all-long-test*` and remove the entry from `docs/agents/specs.md`. This is always the last sub-issue.

### Alternative solutions: target isolation pattern

Today's pytest-style tests (387 files) depend heavily on pytest features: the `client` fixture (3,655 test arguments), `@pytest.mark.parametrize` (34 files, unsupported in `unittest` classes), `monkeypatch` (39 tests) and `django_assert_num_queries` (28 tests). No test uses class-, module- or session-scoped fixtures yet.

Options considered:

- **A. Convert everything to Django `TestCase` + `setUpTestData`.** Rejected: rewriting 387 files (including parametrized ones) before measuring is high risk, and the baseline already showed the cost is not where it was assumed.
- **B. Stay in pytest style with a class- or module-scoped fixture that opens `transaction.atomic()` through `django_db_blocker` and rolls back at the end.** Rejected: it rebuilds `TestCase` on top of pytest-django internals and does not deep-copy shared in-memory objects per test, so mutations leak between tests.
- **C. Keep per-test setup and only make it cheaper.** Kept as the first step, not the end state: low risk, but the savings are limited.
- **D. Hybrid, measurement-driven.** **Chosen.**

#### Decision (option D)

- **New tests** use Django `TestCase` + `setUpTestData`.
- **Existing pytest-style modules** first get the cheap fixes from sub-issues 4 to 7 (cache fixture, `TokenFactory`, optional `UserProfile`, history off).
- **Conversions** to `TestCase` happen only in sub-issue 8, one module or app per PR, **only for modules the durations report shows as slow**, slowest first. A module is not converted just because it is touched for another reason, so test refactors do not get mixed into unrelated feature PRs.
- Modules that depend on `@pytest.mark.parametrize` either stay in pytest style or have it replaced by `subTest` during conversion. The conversion PR states which.
- The isolation policy **forbids database-writing fixtures scoped to a class, module or session** (option B), because of the leak risk described in Edge cases.
- The spec (`isolation-policy.md`) records which modules have been converted, so the period with two styles stays visible and measurable.

### Edge cases

Each spec page must cover the edge cases relevant to it. Known so far:

#### Transactional tests (10 files)

These must keep real transaction semantics. Each one gets a justification comment (sub-issue 8); none is converted.

- Concurrency tests that use `threading.Barrier` and need committed rows visible across threads: `statistics/tests/middleware_test.py` (login burst), `statistics/tests/visit_tracking_test.py`, `accounts/tests/models/authorization_request_test.py`, `accounts/tests/authorization_requests/poll_test.py`.
- Statistics reset and clear: `statistics/tests/reset_test.py`, `staff/tests/staff_statistics_clear_test.py`.
- Migration tests: `domains/tests/migrations/migrate_domain_title_test.py`, `accounts/tests/models/password_reset_token_table_migration_test.py`, `games/tests/models/character/character_public_slain_migration_test.py`, `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py`.

All 10 are in `pytest_all`. A transactional test flushes every table after each test, and a migration test migrates the schema backwards and forwards. Both are expensive on MySQL, so they are a likely cause of `pytest_all` being the slowest job. The durations report (sub-issue 3) must confirm or rule this out, and the CI rebalancing (sub-issue 2) should spread them across jobs.

#### `simple_history` (13 test files)

- Application code does not read `simple_history` records at runtime. They are only exposed through `versioning/admin.py`. `GameDocumentPageHistory` is a custom model, not `simple_history`, so disabling `simple_history` does not affect it.
- 13 test files assert on history and need an explicit opt-in (for example a marker or fixture that re-enables history): `common/tests/history_test.py`, `versioning/tests/historical_records_test.py`, `accounts/tests/models/password_reset_token_history_test.py`, `accounts/tests/models/authorization_request_test.py`, `staff/tests/staff_copies_documents_test.py`, `games/tests/models/copied_from_test.py`, `games/tests/models/game/game_document_page_history_test.py`, `games/tests/models/game/game_recipe_test.py`, two recipe detail PATCH view tests (PC and NPC), and three game document page view tests.
- The opt-in must restore the disabled state afterwards, so one test cannot leave history enabled for the next.

#### Shared in-memory cache

- `memory_cache` is a process-wide module object (`majora_project/cache/__init__.py`), cleared by hand in only 16 test files.
- Adding an autouse clear fixture (sub-issue 4) can change outcomes: a test that passes today only because an earlier test warmed the cache will start failing. Those failures are real bugs in the test and must be fixed, not worked around.
- Autouse pytest fixtures also run for Django `TestCase` classes under pytest, so a single fixture covers both isolation patterns.

#### Shared-scope setup

- With `setUpTestData`, database changes are rolled back after each test and in-memory attributes are deep-copied per test, so a test that mutates a shared object does not leak.
- A module-scoped pytest fixture that writes to the database (through `django_db_blocker`) is **not** rolled back per test. Data created or changed by one test leaks into the next. The isolation policy must state how this is prevented (see the alternative solutions topic).

#### Factories

- `TokenFactory` must generate a unique `key` per token, and the default must keep producing a valid token for an approved user.
- Making the `UserProfile` attachment in `UserFactory` optional must keep **approved** as the default. Tests that hit the approval gate would otherwise start failing with permission errors. Skipping the profile is an explicit opt-out.

#### `--reuse-db`

- A reused local database does not pick up new migrations automatically. The documented local command must say when to pass `--create-db` (after pulling or writing migrations). CI always uses `--create-db`.

### Backward compatibility

#### Application behaviour

- No production behaviour changes. Every change is in test code, test settings (`settings_test.py`), pytest configuration, the `Makefile` or CI.
- The only allowed change outside test code is making history recording disableable. `django-simple-history` 3.13.0 is installed; sub-issue 7 must check which switch it offers (for example a settings flag or a context manager) and use that, instead of patching models. The default stays **enabled**, and only `settings_test.py` turns it off.
- `HistoryRequestMiddleware` stays in place.

#### Agent and contributor instructions

- `.claude/agents/backend.md` (Tests section) currently tells agents to decorate test classes with `@pytest.mark.django_db` and to "use `setup_method` for per-test fixtures". This is the pattern the Epic replaces, and agents keep producing it for every new test.
- So the rule for new tests from option D must reach the agent instructions **early**, not only in sub-issue 11. Sub-issue 1 (write the specs) also updates the Tests section of `.claude/agents/backend.md` and `.github/agents/backend.agent.md` to point at `isolation-policy.md`. Sub-issue 11 then repoints them at the permanent `docs/agents/testing.md`.
- The `assert` style rule stays: plain `assert` works inside Django `TestCase` under pytest.

#### CI jobs (sub-issue 2)

- `main` has no branch protection, so renaming or adding pytest jobs does not break required status checks. Sub-issue 2 must still check for any repository rulesets before renaming.
- Every new or renamed pytest job must keep uploading its partial coverage to Codacy, and `coverage-final` must require all of them, so total coverage stays the same.
- `docs/agents/contributing.md` (CI jobs per folder table), `.claude/agents/infra.md` (pipeline diagram and job table) and `.claude/agents/backend.md` list the current job names. Sub-issue 2 updates them.

#### Test commands

- `--reuse-db` must not change what CI runs: CI passes `--create-db` explicitly.
- Existing commands keep working: `docker-compose run --rm majora_tests pytest` (`AGENTS.md`), `.claude/scripts/check_backend.sh`, and `poetry run pytest` (`README.md`). `make tests-fast` is added alongside them, not as a replacement.

#### Test identity

- Converting a module to `TestCase` may rename test classes or tests (for example parametrized tests turned into `subTest`). Each conversion PR states any renamed tests, so collected test counts can still be compared (see Testing strategy).
- If CI uses timing-based splitting (sub-issue 2), renamed tests lose their timing history until the next run. This is acceptable.

### Testing strategy

The Epic changes tests, not features, so "verified" means: the same tests still run, they still pass, coverage does not drop, and the runtime goes down.

#### Required in every sub-issue PR that touches tests or CI (2 to 10)

1. **Same test set.** Compare `pytest --collect-only -q` output before and after the change, for the affected paths (or the whole suite for CI and configuration changes). The node ID lists must match, except for renames the PR lists explicitly (for example parametrized tests turned into `subTest`).
2. **All green.** The full suite passes in CI. No test is skipped, marked `xfail` or deleted to get there.
3. **Coverage does not drop.** Codacy's total coverage after the PR is the same or higher.
4. **Timing is reported.** The PR description gives the before and after time of the affected CI jobs (and of the affected modules, from the durations report once sub-issue 3 has landed). The new numbers are added to `baseline.md`.

#### Specific checks

- **Sub-issue 2 (CI rebalancing):** the union of the collected tests of all pytest jobs equals the collected tests of a single full `pytest` run, with no test missing or run twice.
- **Sub-issue 4 (cache fixture):** any test that starts failing once the cache is cleared automatically is fixed in the same PR, and the PR lists them.
- **Sub-issue 7 (history off):** the 13 history test files pass with the opt-in. A test asserts that history is **off** by default under `settings_test.py`, and that the production settings leave it **on**.
- **Sub-issue 8 (conversions):** besides the checks above, each converted module is run on its own and as part of the full suite, to catch dependence on test order.
- **Sub-issue 10 (xdist):** the result set with xdist equals the serial result set (same node IDs, same outcomes).

#### Keeping the policy enforced

"No new test violates the policy" is enforced by a small check script run in the existing `checks` CI job. Each rule is added by the sub-issue that removes the last violation, so the script never fails on existing code:

- Sub-issue 4 adds: no `memory_cache.clear()` in test files (the autouse fixture handles it).
- Sub-issue 5 adds: no `Token.objects.create` in test files (use `TokenFactory`).
- Sub-issue 8 adds: every `TransactionTestCase` or `django_db(transaction=True)` has a justification comment directly above it, and no fixture scoped to a class, module or session writes to the database.

"New tests use `TestCase` + `setUpTestData`" is not enforced by the script, because telling new test files from old ones is fragile. It is enforced through the agent instructions (see Backward compatibility) and code review.

#### Measurement replaces INSERT counting

Success is measured by runtime (the timing report above), not by counting `INSERT` statements per test. Counting INSERTs needs extra tooling, and runtime is what the Epic is trying to improve.

### Permissions

Not applicable: the Epic adds no endpoint, serializer field or access rule, and changes no authentication or visibility logic.

### Non-goals

- Rewriting tests to a different framework.
- Changing application code purely for test speed, except making history recording disableable.
- Reducing coverage requirements.
- Converting test modules that the durations report does not show as slow.

### Documentation

- Sub-issue 1 (write the specs): `docs/agents/specs/pytest-all-long-test.md` and `docs/agents/specs/pytest-all-long-test/*.md` (new), registered in `docs/agents/specs.md`; the Tests section of `.claude/agents/backend.md` and `.github/agents/backend.agent.md` points at `isolation-policy.md`.
- Sub-issues 2 to 10: update the relevant spec pages as each one lands (for example the conversion state in `isolation-policy.md` and the timings in `baseline.md`). Sub-issue 2 also updates the job names in `docs/agents/contributing.md`, `.claude/agents/infra.md` and `.claude/agents/backend.md`.
- Sub-issue 11 (remove the specs): `docs/agents/testing.md` (new, permanent isolation policy), `docs/agents/index.md`, `docs/agents/summary.md`, `AGENTS.md` (fast local command and link to the policy), and the backend agent instructions repointed at `testing.md`; the spec files and their entry in `docs/agents/specs.md` are deleted.

## Benefits

- Faster CI feedback on every pull request, starting with cheap wins (job rebalancing) before any test is rewritten.
- A faster local loop (`--reuse-db`, no coverage) for developers and agents.
- One documented isolation policy, so new tests stop adding per-test cost and nobody has to guess which pattern to use.
- Fewer hidden dependencies between tests (cache, history, shared state), making the suite more reliable and ready for parallel runs.
- Decisions driven by measurement: every change reports its timing impact, so effort goes where the time actually is.
