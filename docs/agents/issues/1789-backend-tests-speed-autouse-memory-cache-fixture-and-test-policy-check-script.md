# Issue: Backend tests speed: autouse memory cache fixture and test-policy check script

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). After #1788 and #1798, the slowest pytest job is `pytest_views_game` at 4m 56s and the `test` workflow takes 5m 12s (pipeline 5913, see `baseline.md`).

Replace the manual `memory_cache.clear()` calls in tests with one autouse fixture, and create the test-policy check script that later sub-issues (#1790, #1793) extend with their own rules.

## Problem

- `memory_cache` (`backend/majora_project/cache/__init__.py`) is a process-wide object. 15 test files clear it by hand (30 calls), mostly in `setup_method` or `setUp`; any other test that reads a cached value can pass or fail depending on what ran before it.
- The Epic's isolation policy (`docs/agents/specs/pytest-all-long-test/isolation-policy.md`) needs automated enforcement, so removed patterns do not come back. No check script exists yet.

## Expected Behavior

### Autouse fixture

- An autouse, function-scoped fixture in the root `backend/conftest.py` calls `memory_cache.clear()` **before** each test (no clearing on teardown). It also runs for Django `TestCase` and `TransactionTestCase` classes under pytest.
- It runs before `setup_method` / `setUp`, so a test that primes the cache in its setup (e.g. `staff/tests/staff_cache_clear_test.py`) keeps working. Cache state warmed in `setUpTestData` / `setUpClass` is cleared before each test.
- No test file calls `memory_cache.clear()` in setup code. The only call left is in `games/tests/caches/registered_domains_cache_test.py::test_cleared_by_memory_cache_clear`, where clearing mid-test is the behavior under test, and it carries the opt-out marker below.
- Any test that starts failing once the cache is cleared automatically is fixed in the same PR (it depended on cache state from an earlier test or from class setup), never skipped or worked around. The PR lists them.

### Check script

- `backend/bin/check_test_policy.py`: Python, standard library only (`ast`, `pathlib`, `tokenize` for comments), like `bin/junit_summary.py`.
- It scans the `*_test.py` files under the `testpaths` of `backend/pyproject.toml` (and `conftest.py` files), reports every violation as `path:line: rule-id: message`, and exits non-zero when there is any.
- One function per rule, registered in a list, so #1790 (`TokenFactory`) and #1793 (transactional justification, class/module/session-scoped DB fixtures) each add a rule without restructuring. AST-based, so #1793's fixture-scope rule is feasible.
- First rule, `memory-cache-clear`: no `memory_cache.clear()` call in test files.
- Inline opt-out: a line ending with `# test-policy: allow <rule-id>` is exempt from that rule only. The script prints the opt-outs it honoured (without failing), so they stay visible in the CI log.
- CI: a new "Check test policy" step in the existing `checks` job in `.circleci/config.yml`, after "Check python Lint" (`poetry run python bin/check_test_policy.py`; the job already copies `backend/*` to the root).
- Local: `docker-compose run --rm majora_tests poetry run python bin/check_test_policy.py`, never on the host.

### Docs

- `isolation-policy.md`: the "Cache (#1789)" rule moves from placeholder to an actual rule, including the opt-out marker.
- `edge-cases.md` ("Shared in-memory cache"): records the tests fixed because they relied on leftover cache state, or states that none were.
- `verification.md` ("Check-script rules"): documents the script, how to run it locally, the opt-out marker, and marks the `memory_cache.clear()` rule as added.
- `.claude/agents/backend.md`: one line saying tests never clear `memory_cache` by hand and the check script must pass.

## Solution

- Add the fixture to `backend/conftest.py`, remove the 29 setup-time calls and their now-unused `memory_cache` imports, mark the one remaining call with `# test-policy: allow memory-cache-clear`, run the full suite and fix any test that relied on leftover cache state.
- Add `backend/bin/check_test_policy.py` and the "Check test policy" step in the `checks` job.
- Owners: `backend` (fixture, tests, script, docs), `infra` (the `checks` job step). Depends on #1786.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The script exits 0 on the PR branch and non-zero on a sample violation (the PR shows both runs, e.g. a temporary file with an unmarked `memory_cache.clear()`).
- The PR description reports the before and after time of the pytest jobs, and the new numbers are added to `baseline.md` (History).

## Benefits

- Tests no longer depend on cache state left by earlier tests, which makes test order (and a later xdist or module conversion) safe.
- New tests do not need to remember to clear the cache.
- The policy script gives #1790 and #1793 a place to enforce their rules in CI.
