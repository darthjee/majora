# 04 — Record the numbers and the CI target

After the PR pipeline has run with timing history (see the plan Notes):

- `docs/agents/specs/pytest-all-long-test/baseline.md`:
  - Add a "Rebalanced jobs (#1788)" subsection under CI. Give the pipeline number and workflow id, and for each job and each `pytest_non_views` container (by index): the duration, the pytest wall time, the test count and the slowest file.
  - Replace the `Targets` placeholder with the CI target: the `test` workflow wall-clock time is at most **5m 30s** after #1788, and later sub-issues (#1789–#1794, #1798) lower it. The local target stays with #1794.
  - Add a History row: `#1788 | CircleCI 5900 → <new> | pytest jobs / workflow | 8m 08s / 4m 58s / 2m 55s / 8m 54s | <new values>`.
- In the PR description, give the same before (pipeline 5900) and after numbers. If the workflow misses 5m 30s, say so and why, and do not loosen the target.
- Commit these numbers in a separate commit, after the CI run.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/baseline.md`
