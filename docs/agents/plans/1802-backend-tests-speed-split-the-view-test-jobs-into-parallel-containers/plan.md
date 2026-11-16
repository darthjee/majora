# Plan: Backend tests speed: split the view test jobs into parallel containers

Issue: [1802-backend-tests-speed-split-the-view-test-jobs-into-parallel-containers.md](../../issues/1802-backend-tests-speed-split-the-view-test-jobs-into-parallel-containers.md)

## Overview

This plan replaces the `pytest_views_game` and `pytest_views_rest` CircleCI jobs with one `pytest_views` job. The new job runs with `parallelism: 3` and splits all of `games/tests/views/` by recorded timings. It reuses #1788's "Split test files" logic through a shared reusable command instead of a copy. It then updates every `requires` list, the agent and contributor docs, and the Epic #1785 spec pages. No test changes.

See [infra.md](infra.md) for the full plan.
