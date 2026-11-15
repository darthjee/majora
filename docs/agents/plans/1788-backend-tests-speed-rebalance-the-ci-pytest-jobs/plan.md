# Plan: Backend tests speed: rebalance the CI pytest jobs

Issue: [1788-backend-tests-speed-rebalance-the-ci-pytest-jobs.md](../../issues/1788-backend-tests-speed-rebalance-the-ci-pytest-jobs.md)

## Overview

Rebalance the CircleCI pytest jobs with a hybrid split. Rename `pytest_views_characters` to `pytest_views_game` and keep `pytest_views_rest` as it is. Rename `pytest_all` to `pytest_non_views` and run it with `parallelism: 3`, splitting the test files by their recorded JUnit timings. Then update every `requires` list and the docs, prove that the suite still runs exactly once, and record the new numbers and the CI target (workflow ≤ 5m 30s).

See [infra.md](infra.md) for the full plan.
