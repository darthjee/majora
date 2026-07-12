# Plan: Fix long running Python tests in CI

Issue: [444-fix-long-running-tests.md](../../issues/444-fix-long-running-tests.md)

## Overview

Backend CI test runs (10-20 min across the 3 parallel `pytest_*` CircleCI jobs) are slowed by three compounding issues: a fully redundant migration pass before pytest even starts, real (non-mocked) password hashing on ~279 user-creation call sites in tests, and per-test (rather than per-class) fixture setup across ~94 test files. This plan removes the redundant migration step (infra), wires in a fast test-only password hasher (backend), and refactors the highest-value `setup_method` usages to `setUpTestData` (backend).

## Agents involved

- [infra](infra.md)
- [backend](backend.md)

## Shared contracts

- **CI env/settings module**: `infra` removes the standalone `manage.py migrate` step in `.circleci/config.yml`'s three `pytest_*` jobs — pytest-django already creates and migrates its own `test_majora` database independently, so the two never depended on each other. This is infra-only: no env var or settings module name changes cross the boundary, so `backend`'s work in the same jobs (governed entirely by `source/pyproject.toml`'s `[tool.pytest.ini_options]`) needs no CI YAML changes and does not depend on the migration-step removal landing first (the two can ship independently, in either order).
