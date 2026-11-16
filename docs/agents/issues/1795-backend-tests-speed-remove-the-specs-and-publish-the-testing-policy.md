# Issue: Backend tests speed: remove the specs and publish the testing policy

## Description

Part of Epic #1785, which cut the backend pytest suite runtime (CI first, local runs too). At the start of the Epic, CI was held up by `pytest_all` at 8m 34s (workflow 8m 43s, pipeline 5881). Every other sub-issue (#1786–#1794, #1798, #1802) has merged.

This is the last sub-issue. It moves the lasting knowledge from the spec into a permanent `docs/agents/testing.md`, deletes the spec, and reports the Epic's before and after runtimes.

## Problem

- Specs are temporary design docs (`docs/agents/specs.md`). They are removed once their feature area is implemented and the knowledge has moved into permanent docs. The Epic spec is `docs/agents/specs/pytest-all-long-test.md`, with aspect pages under `docs/agents/specs/pytest-all-long-test/`.
- Three files still link into the spec: `.claude/agents/backend.md` (line 95, isolation policy), `.github/agents/backend.agent.md` (line 15, isolation policy) and `.claude/agents/infra.md` (line 125, `ci-jobs.md`). Deleting the spec without repointing them breaks those links.
- The spec planned "module conversion" sub-issues that #1795 would wait for. None were ever created.
- `baseline.md` still has "pending" History rows for #1790 and #1792, and the Epic does not yet state its final before and after numbers.

## Expected Behavior

- **`docs/agents/testing.md`** exists and is the single permanent reference for backend tests. It contains:
  - the isolation policy from `isolation-policy.md`: which pattern new tests use, the rules for existing pytest-style files, transactions and their `# transactional: <reason>` comment, forbidden scoped database fixtures, the `TestCase` equivalents table, the cache fixture, `TokenFactory`, `UserFactory(with_profile=False)`, the `build_base_game` builder, the `@pytest.mark.history` opt-in, and the short "why" (option D);
  - the condensed edge cases from `edge-cases.md`: transactional and migration tests, history tests, the shared in-memory cache, shared-scope setup, factories, `--reuse-db` with the shared `majora_mysql` caveat, and tests without a database;
  - the `bin/check_test_policy.py` rules and their opt-out comments (`memory-cache-clear`, `token-create`, `transaction-justification`, `scoped-db-fixture`), and the note that "new tests use `TestCase`" is enforced by review, not by the script;
  - the local commands: `docker-compose run --rm majora_tests pytest`, `make tests-fast [ARGS=...]`, `--create-db` and when to pass it, and `.claude/scripts/check_backend.sh`;
  - a short CI section: how `pytest_views` and `pytest_non_views` split the suite (parallelism, timing-based split), coverage upload, the durations report artifacts and how to read them or run the summary locally.
- **Module conversions are out of the Epic.** `testing.md` keeps the rule that existing modules are converted to `TestCase` only by dedicated issues, for modules the durations report shows as slow, one module or app per PR. Those issues are created later and do not block this one.
- **Dropped, not migrated:** the baseline numbers, cost drivers, hypotheses, the conversion counts and table, the rebalancing history and the per-sub-issue verification checklist. The Epic and git history keep them. The pending #1790 and #1792 rows are not backfilled.
- **Links:**
  - `docs/agents/index.md`, `docs/agents/summary.md` and `AGENTS.md` link to `testing.md`. `AGENTS.md` keeps its fast-local-command paragraph and points to `testing.md` for the rest.
  - The Tests section of `.claude/agents/backend.md` and `.github/agents/backend.agent.md` points at `testing.md` instead of the spec.
  - `.claude/agents/infra.md` (the `pytest_non_views` row) points at the CI section of `testing.md` instead of `ci-jobs.md`.
- **Spec removed:** `docs/agents/specs/pytest-all-long-test.md` and `docs/agents/specs/pytest-all-long-test/` are deleted, and their entry is removed from `docs/agents/specs.md`. Afterwards, `grep -r pytest-all-long-test` outside `docs/agents/issues/` and `docs/agents/plans/` finds nothing.
- **Final numbers on the Epic:** the PR posts one comment on #1785 with a before and after table:
  - CI before: pipeline 5881 (`pytest_all` 8m 34s, `pytest_views_characters` 5m 04s, `pytest_views_rest` 3m 35s, workflow 8m 43s);
  - CI after: the latest `main` pipeline (workflow and each pytest job);
  - local before: the #1794 baseline (2m 01s without `--cov`, 3m 19s with `--cov`), on the machine stated in `baseline.md`;
  - local after: a fresh `make tests-fast` run (second consecutive run) on the same machine.
  The PR description shows the same table.

## Solution

- Docs only: no test, CI or application change.
- Owner: `architect`. Depends on every other sub-issue of Epic #1785, all of which are merged.
- Write `testing.md` from `isolation-policy.md` (almost unchanged), then add the condensed edge cases, check-script rules, local commands and CI section. Repoint the three agent files, update `index.md`, `summary.md`, `AGENTS.md` and `specs.md`, and delete the spec in the same change, so no link is ever broken.
- Verification: `grep -r pytest-all-long-test` is clean outside issues and plans, every relative link in the changed files resolves, and the Epic comment is posted.
