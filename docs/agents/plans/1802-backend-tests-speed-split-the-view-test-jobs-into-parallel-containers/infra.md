# Infra Plan: Backend tests speed: split the view test jobs into parallel containers

Main plan: [plan.md](plan.md)

## Overview

This plan merges the two path-based view jobs into a single `pytest_views` job with `parallelism: 3`, split by timings over `games/tests/views/`. The job split comes first, then the renames, then the docs. Timings are recorded only from a pipeline that splits by timings: the first pipeline after the rename has no timing history.

## Context

- `.circleci/config.yml` today has the following jobs:
  - `pytest_views_game` (`games/tests/views/game/`, line ~190)
  - `pytest_views_rest` (`games/tests/views/ --ignore=games/tests/views/game/`, line ~219)
  - `pytest_non_views` (`parallelism: 3`, line ~250), whose inline "Split test files" step globs every `testpaths` entry from `pyproject.toml`, drops `^games/tests/views/`, and runs `circleci tests split --split-by=timings --timings-type=filename` into `test-reports/test-files.txt`. It fails on an empty share and exports `TEST_FILES` through `$BASH_ENV`.
- All three jobs call the reusable `pytest_with_reports` command (top-level `commands:`), which runs pytest with coverage, durations and the JUnit report (`xunit1`), uploads the partial Codacy coverage and stores `test-reports/`.
- The old names appear in `requires` of `coverage-final` (line ~37) and of 9 tag-only release jobs (lines ~76–133), and in:
  - `.claude/agents/infra.md` (diagram ~109–110, job table ~125–126, `wake-navi` row ~138)
  - `docs/agents/contributing.md` (~40)
  - the spec pages `docs/agents/specs/pytest-all-long-test/ci-jobs.md` and `baseline.md`

  Historical mentions in `baseline.md` tables and History rows stay as they are, since they record past pipelines.
- pipeline 5913: `pytest_views_game` 4m 56s (268.08s pytest), `pytest_views_rest` 2m 58s (106.27s), `pytest_non_views` 2m 33s, workflow `test` 5m 12s.

## Steps

- [01 — Shared split command and the pytest_views job](infra/01-pytest-views-job.md)
- [02 — Replace the old job names in requires and agent docs](infra/02-renames.md)
- [03 — Update the Epic spec pages](infra/03-spec-docs.md)
- [04 — Verify, open the PR and record timings](infra/04-verify-and-record.md)

## CI Checks

- `.circleci/config.yml`: `circleci config validate`, run through docker if the CLI is not on the host (`docker run --rm -v "$PWD":/repo -w /repo circleci/circleci-cli:latest circleci config validate`). There is no local run of the split itself; the real check is the PR's pipeline.
- `docs/`, `.claude/`: the `markdownlint` CI job.
- No test file changes. `docker-compose run --rm majora_tests pytest --collect-only -q` before and after must give identical output.

## Notes

- **Timing history:** `circleci tests split --split-by=timings` reads history stored for the same job name. The first pipeline of the PR splits `pytest_views` by name, and `pytest_non_views` must keep its history, because its job name doesn't change. Record numbers only from a later pipeline, for example the one of the commit that records the numbers, as #1788 did.
- **Shared behavior modules** (`_entity_token_scopes_behavior.py`, `_common_items_filters_behavior.py`, `_permissions_token_scopes_behavior.py`): JUnit credits inherited tests to the defining module, so the files that inherit them are under-weighted in the split. This is accepted and documented. Never change tests to balance the split.
- **`parallelism`:** 3 to start, tune between 2 and 4 from the recorded runs.
- **Ruleset:** confirm `gh api repos/darthjee/majora/rulesets` still shows no required status checks for `protect main` just before merging.
- **The `pytest_non_views` file list must not change:** after the refactor its split input must stay byte-identical, except for the order of operations inside the command.
