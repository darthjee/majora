# Write docs/agents/testing.md

Create the permanent backend testing reference. Start from `docs/agents/specs/pytest-all-long-test/isolation-policy.md` almost unchanged, drop the "Part of the ... specs" line and the issue numbers in parentheses (e.g. "(#1789)"), and fold "Rules added later" into the main sections (the `build_base_game` builder goes under "New tests" / setUpTestData). Then add, condensed:

1. **Edge cases** from `docs/agents/specs/pytest-all-long-test/edge-cases.md`: transactional and migration tests, history tests, shared in-memory cache, shared-scope setup, base game builder, factories (`UserFactory(with_profile=False)`, `TokenFactory`), `--reuse-db` with the shared `majora_mysql` caveat, tests without a database. Skip "Branches written to the old instructions" and "Test identity" (Epic-only).
2. **Check script**: the `bin/check_test_policy.py` rules from `docs/agents/specs/pytest-all-long-test/verification.md` ("Check-script rules"): `memory-cache-clear`, `token-create`, `transaction-justification`, `scoped-db-fixture`, their opt-out comments, what files are scanned, that it runs in the `checks` CI job, and that "new tests use `TestCase`" is enforced by review only.
3. **Local commands**: `docker-compose run --rm majora_tests pytest`, `make tests-fast [ARGS=...]`, `--create-db` and when to pass it, `.claude/scripts/check_backend.sh` (always `--create-db`).
4. **CI** from `docs/agents/specs/pytest-all-long-test/ci-jobs.md`: `pytest_views` and `pytest_non_views` (parallelism 3, `circleci tests split --split-by=timings`), coverage upload, the durations report artifacts (`durations.txt`, `durations-by-file.md`, `junit.xml`), how to read them and how to run the summary locally. Skip the rebalancing history, timing history and "next candidate" sections.
5. **Module conversions**: keep the rule that existing modules are converted to `TestCase` only by dedicated issues, for modules the durations report shows as slow, one module or app per PR.

Verify every command and path quoted (Makefile target, `backend/conftest.py` fixtures, `majora_project/settings_test.py`, `games/tests/factories`, CI job names) against the current code before writing it. Follow `docs/agents/documentation.md` formatting.

## Files to Change

- `docs/agents/testing.md` — new file.
