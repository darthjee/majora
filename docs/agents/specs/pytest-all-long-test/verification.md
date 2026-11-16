# Verification

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

The Epic changes tests, not features, so "verified" means: the same tests still run, they still
pass, coverage does not drop, and the runtime goes down.

## Checklist for every PR

Required in every sub-issue PR that touches tests or CI (#1787 to #1794, and the module
conversions):

1. **Same test set.** Compare `pytest --collect-only -q` output before and after the change, for
   the affected paths (or the whole suite for CI and configuration changes). The node ID lists
   match, except for renames the PR lists explicitly (for example parametrized tests turned into
   `subTest`).
2. **All green.** The full suite passes in CI. No test is skipped, marked `xfail` or deleted to
   get there.
3. **Coverage does not drop.** Codacy's total coverage after the PR is the same or higher.
4. **Timing is reported.** The PR description gives the before and after time of the affected CI
   jobs (and of the affected modules, from the durations report once #1787 has landed), and the
   new numbers are added to [Baseline](baseline.md#history).

## Specific checks

- **#1788 (CI rebalancing):** the union of the collected tests of all pytest jobs equals the
  collected tests of a single full `pytest` run, with no test missing or run twice.
- **Check script (#1789):** `bin/check_test_policy.py`, run from `backend/` with
  `poetry run python bin/check_test_policy.py` (docker-compose: `docker-compose run --rm
  majora_tests poetry run python bin/check_test_policy.py`). It reads `testpaths` from
  `pyproject.toml`, prints `path:line: rule-id: message`, and exits `0` clean, `1` violations,
  `2` configuration error. To add a rule, write a `rule(tree, path) -> list[Violation]` function
  and append it to `RULES`. A line is allowed with `# test-policy: allow <rule-id>`; allowed
  lines are printed as opt-outs.
- **#1789 (cache fixture):** any test that starts failing once the cache is cleared
  automatically is fixed in the same PR, and the PR lists them.
- **#1792 (history off):** the 13 history test files pass with the opt-in. A test asserts that
  history is **off** by default under `settings_test.py`, and that the production settings leave
  it **on**.
- **Module conversions:** each converted module is run on its own and as part of the full suite,
  to catch dependence on test order.
- **xdist follow-up (if created):** the result set with xdist equals the serial result set (same
  node IDs, same outcomes).

## Check-script rules

The script scans every `.py` file under the `testpaths` (test files, conftests and helper
modules), plus the root `conftest.py`. Rules so far: `memory-cache-clear` (#1789) and
`token-create` (#1790).

"No new test violates the policy" is enforced by a small check script run in the existing
`checks` CI job, created by #1789. Each rule is added by the sub-issue that removes the last
violation, so the script never fails on existing code.

| Rule | Added by | Status |
|------|----------|--------|
| No `memory_cache.clear()` in test files (the autouse fixture handles it) | #1789 | added |
| No `Token.objects.create` in test files (use `TokenFactory`) | #1790 | added |
| Every `TransactionTestCase` or `django_db(transaction=True)` has a justification comment directly above it | #1793 | not yet added |
| No fixture scoped to a class, module or session writes to the database | #1793 | not yet added |

"New tests use `TestCase` + `setUpTestData`" is **not** enforced by the script, because telling
new test files from old ones is fragile. It is enforced through the backend agent instructions
and code review.
