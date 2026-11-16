# Verify, open the PR and record timings

1. **Same test set:** `docker-compose run --rm majora_tests pytest --collect-only -q` on `main` and on the branch gives identical output, since no test file changed. State it in the PR.
2. Open the PR, then wait for its pipeline. Expect `pytest_views` to log the "Falling back to weighting by name" message on this first run.
3. Push a follow-up commit, for example the step 5 docs commit, so a second pipeline runs with timing history. Read these numbers from that pipeline through the CircleCI API or UI:
   - the duration of each `pytest_views` and `pytest_non_views` container;
   - the job durations;
   - the workflow `test` time;
   - each container's pytest wall time and test count, from `durations-by-file.md`.
4. **Exact coverage:**
   - the three `pytest_views` `test-files.txt` lists together equal every `*_test.py` under `games/tests/views/` at the head commit, with no duplicate;
   - together with the three `pytest_non_views` lists, they equal every `*_test.py` under the `testpaths`;
   - the Tests tab counts add up to 4,285 for `pytest_views` and 4,805 for `pytest_non_views`.
5. Add to `docs/agents/specs/pytest-all-long-test/baseline.md`:
   - a `### Parallel view jobs (#1802)` section with the per-container table and the comparison with pipeline 5913;
   - a History row: `#1802 | CircleCI 5913 → <n> | pytest jobs / workflow | 4m 56s / 2m 58s / 2m 33s / 5m 12s | <after>`.

   Fill in the "Next candidate" paragraph in `ci-jobs.md`. If one container is much slower because of the behavior modules, record it there.
6. Make sure Codacy coverage did not drop, CI is green and the ruleset check passed. Put the before and after timings in the PR description.

## Files to Change
- `docs/agents/specs/pytest-all-long-test/baseline.md` — #1802 section and History row.
- `docs/agents/specs/pytest-all-long-test/ci-jobs.md` — the "Next candidate" paragraph, with the recorded numbers.
