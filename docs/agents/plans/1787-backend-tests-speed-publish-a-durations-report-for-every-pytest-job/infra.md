# Infra Plan: Backend tests speed: publish a durations report for every pytest job

Main plan: [plan.md](plan.md)

## Overview

Every pytest CI job (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`) writes its reports into `backend/test-reports/` and stores them as CircleCI artifacts and test results. A new dependency-free script turns the JUnit XML into a per-file and per-directory time summary. Once the PR's pipeline has run, the same PR records the first numbers in the specs (Epic #1785).

## Context

- Spec hub: `docs/agents/specs/pytest-all-long-test.md`; pages touched here: `baseline.md`, `cost-drivers.md`, `ci-jobs.md` in `docs/agents/specs/pytest-all-long-test/`.
- `.circleci/config.yml` is `version: 2.1`. The three jobs are identical except for the pytest paths (lines ~153–252); each runs `poetry run pytest <paths> --cov --cov-report=lcov:coverage/lcov.info` from `working_directory: ~/project/backend`, then uploads partial coverage to Codacy.
- `backend/bin/` is outside the coverage `source` and the pytest `testpaths` in `backend/pyproject.toml`, so a script there affects neither.
- No host runtimes: the script is run in CI and, locally, only in the `majora_tests` docker-compose service.
- No test, application code, job name or `requires` list changes in this issue (#1788 renames and rebalances).

## Steps

- [01 — Add the JUnit per-file summary script](infra/01-junit-summary-script.md)
- [02 — Publish the reports from the three pytest jobs](infra/02-ci-reports.md)
- [03 — Document the report and fix spec drift](infra/03-docs.md)
- [04 — Record the first numbers from the PR pipeline](infra/04-record-first-numbers.md)

## CI Checks

- `.circleci/config.yml`: `circleci config validate` (if the CLI is available; otherwise rely on the pipeline itself) — CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`, `coverage-final`.
- `backend/bin/junit_summary.py`: `poetry run ruff check .` inside the backend container (CI job: `checks`).
- Docs: CI job `markdownlint`.

## Notes

- Verification for every Epic PR applies: same `pytest --collect-only -q` output, all green, no coverage drop, before/after job times in the PR description and in `baseline.md`'s History.
- Step 04 needs the PR's pipeline to finish before it can be written; it is a second commit on the same PR, not a separate issue.
- Hypotheses 1 and 3 in `cost-drivers.md` are the ones this report can settle; leave the others `open` unless the numbers clearly settle them.
