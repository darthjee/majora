# Infra Plan: Backend tests speed: rebalance the CI pytest jobs

Main plan: [plan.md](plan.md)

## Overview

Only CI configuration and docs change. No test, application or coverage-configuration change. The plan uses the durations report from #1787 (pipeline 5900): `pytest_all` 8m 08s, `pytest_views_characters` 4m 58s, `pytest_views_rest` 2m 55s, workflow 8m 54s. The two slowest migration files (113.50s and 110.33s) cannot be split, and every job or container pays a fixed cost of about 80s.

## Context

- `.circleci/config.yml` is `version: 2.1`. The reusable `pytest_with_reports` command (top-level `commands:`) takes a `paths` string and runs pytest with `--cov`, `--durations=0` and `--junitxml=test-reports/junit.xml -o junit_family=xunit1`. It then uploads partial coverage to Codacy, builds the durations report (`when: always`) and stores the test results and artifacts.
- `coverage-final` (workflow line ~37) and 9 tag-only release jobs (lines ~76–133) list `pytest_views_characters, pytest_views_rest, pytest_all` in `requires`.
- `backend/pyproject.toml` `testpaths`: `accounts/tests`, `games/tests`, `staff/tests`, `permissions/tests`, `common/tests`, `domains/tests`, `versioning/tests`, `statistics/tests`, `conversations/tests`, `miniatures/tests`, `uploads/tests`; `python_files = ["*_test.py"]`.
- The `protect main` ruleset has no required status checks, so renaming jobs breaks no PR check.

## Steps

- [01 — Rename and split the pytest jobs](infra/01-ci-split.md)
- [02 — Prove the split runs the full suite once](infra/02-verify-split.md)
- [03 — Update the docs](infra/03-docs.md)
- [04 — Record the numbers and the CI target](infra/04-record-numbers.md)

## CI Checks

- `.circleci/`: `circleci config validate`, run through docker (for example `docker run --rm -v "$PWD":/repo -w /repo circleci/circleci-cli:latest circleci config validate`), never a host install. CI jobs: all of them.
- `backend/`: `docker-compose run --rm majora_tests pytest --collect-only -q` (CI jobs: `pytest_views_game`, `pytest_views_rest`, `pytest_non_views`).
- `docs/`: `yarn lint_md` via docker-compose / make (CI job: `markdownlint`).

## Notes

- On the first pipeline after the rename, `pytest_non_views` has no timing history under its new name, so CircleCI splits by name. Take the recorded numbers from a later run (push an empty commit or re-run the workflow if needed), and say in the PR which run they come from.
- If a container still takes much longer than the others because both slow migration files land in it, try `parallelism: 4` before anything else. Never change the tests (#1798 makes them faster).
- `pytest_views_game` (about 5m) becomes the critical path. Splitting it further is out of scope. Mention it in `ci-jobs.md` as the next candidate.
