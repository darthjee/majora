# Verify and record numbers

Evidence for the PR description (Epic verification checklist):

1. **Same test set:** `docker-compose run --rm majora_tests pytest --collect-only -q` on
   `origin/main` and on the branch; the node ID lists are identical (diff them, report the count).
2. **All green:** full suite passes locally and in CI; nothing skipped, `xfail`ed or deleted.
3. **Coverage:** Codacy total coverage is the same or higher.
4. **Script:** the two runs from step 02 (clean exit `0`, sample violation exit `1`).
5. **Timing:** before (pipeline 5913, see `baseline.md`) and after numbers for
   `pytest_views_game`, `pytest_views_rest`, `pytest_non_views` (per container) and the `test`
   workflow, from the PR's CI run. Add a History row for #1789 in
   `docs/agents/specs/pytest-all-long-test/baseline.md` in a separate commit once CI has run.
   No speed gain is expected; the row records that the change is neutral.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/baseline.md` — History row for #1789 (after CI).
