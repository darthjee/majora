# Document the report and fix spec drift

- `docs/agents/specs/pytest-all-long-test/ci-jobs.md`:
  - Replace the "*Planned by #1787.*" text in "Durations report (#1787)" with the actual setup: flags (`--durations=0 --junitxml=test-reports/junit.xml -o junit_family=xunit1`), the artifact files (`pytest-output.txt`, `durations.txt`, `durations-by-file.md`, `junit.xml`) and where to find them (job → Artifacts tab; Tests tab for per-test results), how to run `bin/junit_summary.py` in the `majora_tests` container, and how to read the per-file and setup/call/teardown numbers.
  - Update the "Current split" table's commands to show the new flags (or note that every job adds them).
  - Fix the MySQL image: the config uses `cimg/mysql:8.4.13`, not `cimg/mysql:8.0`.
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md`: same MySQL image fix in "Context".
- `.claude/agents/infra.md`: fix the `cimg/mysql:8.0` mention in the jobs table (line ~123) and mention that pytest jobs store durations reports and JUnit results.
- `docs/agents/specs/pytest-all-long-test/baseline.md` "How to measure": state that the durations report now exists and where it is.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/ci-jobs.md` — durations report section, commands, MySQL image.
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` — MySQL image.
- `docs/agents/specs/pytest-all-long-test/baseline.md` — "How to measure" wording.
- `.claude/agents/infra.md` — MySQL image, report mention.
