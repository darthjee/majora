# Record the first numbers from the PR pipeline

After pushing steps 01–03, wait for the PR's CircleCI pipeline to finish, then download the artifacts of the three pytest jobs (CircleCI API: `/project/gh/darthjee/majora/<job-number>/artifacts`, or the UI) and add a second commit to the same PR.

- `docs/agents/specs/pytest-all-long-test/baseline.md`:
  - a "First durations report" subsection under "CI", citing the pipeline number: per job, the 10 slowest files and the 10 slowest tests (setup and call separately); the total share of `pytest_all` taken by the 10 transactional files listed in `edge-cases.md` (and by the 4 migration tests alone); and the overall setup vs call split per job (sum of `setup` vs `call` entries in `durations.txt`);
  - the new job durations of this pipeline, compared with pipeline 5881;
  - a row in the "History" table for #1787 (pipeline, jobs, before, after).
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` "Hypotheses": set hypothesis 1 and hypothesis 3 to **confirmed** or **ruled out**, adding the numbers and the pipeline number to the last column. Leave the others `open` unless the report clearly settles one.
- PR description: before (pipeline 5881) and after times of the three pytest jobs and the workflow, the pipeline link used, and confirmation that each job shows its artifacts and a filled Tests tab.
- If the pipeline fails for a reason unrelated to this change, re-run it rather than recording partial numbers.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/baseline.md` — first report and History row.
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` — hypothesis statuses.
