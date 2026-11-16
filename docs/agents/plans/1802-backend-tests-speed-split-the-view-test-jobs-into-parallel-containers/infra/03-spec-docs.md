# Update the Epic spec pages

1. `docs/agents/specs/pytest-all-long-test/ci-jobs.md`:
   - **Current split:** make the table two jobs, `pytest_views` (`games/tests/views/`, `parallelism: 3`, split by timings) and `pytest_non_views`. Keep a "Before #1802 (pipeline 5913)" column with 4m 56s / 2m 58s for the old view jobs and 2m 33s for `pytest_non_views`.
   - **Split mechanics:** describe the shared `split_test_files` command and its `include`/`exclude` parameters, instead of a `pytest_non_views`-only step. Say that each parallel job writes `test-reports/test-files.txt`.
   - **Coverage and release jobs:** update the job lists (`coverage-final` requires `pytest_views`, `pytest_non_views`, `jasmine`, `client_tests`).
   - **Artifacts table:** `test-files.txt` now exists in both parallel jobs.
   - **Rebalancing:** add a `### Parallel view jobs (#1802)` subsection covering:
     - the choice: merge both view jobs into `pytest_views` with `parallelism: 3`;
     - the two rejected alternatives: `pytest_views_game` alone with `parallelism: 2`, which keeps a hand-picked path; and one `pytest` job for the whole suite with `parallelism: 6`, which reverses #1788's hybrid choice;
     - the estimate: about 280s of view work / 3 + ~80s fixed cost, about 3m per container.
   - **Shared behavior modules:** a short paragraph on how the three `_*_behavior.py` modules skew the filename timings, and why that is accepted.
   - **Next candidate:** say what the critical path is after #1802, filled in step 04 from the recorded run, and point at the per-test work (#1790–#1793) and the fixed ~80s per container.
   - **Exact coverage:** the union of both jobs' `test-files.txt` artifacts covers every test file.
2. `docs/agents/specs/pytest-all-long-test.md`:
   - add #1798 and #1802 to the sub-issue table: #1798 is backend, depends on #1787, pages Baseline and Cost drivers; #1802 is infra, depends on #1788, pages CI jobs and Baseline;
   - add #1802 after #1788 in Sequencing.
3. `docs/agents/specs/pytest-all-long-test/cost-drivers.md`: mark hypothesis 2 **confirmed**, with the evidence: pipeline 5900 → 5913, workflow 8m 54s → 5m 12s after #1788, together with #1798.
4. Leave `baseline.md` for step 04.

## Files to Change
- `docs/agents/specs/pytest-all-long-test/ci-jobs.md` — new split, shared command, #1802 rebalancing subsection, behavior-module caveat.
- `docs/agents/specs/pytest-all-long-test.md` — sub-issue table and sequencing.
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` — hypothesis 2 status.
