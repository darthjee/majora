# Plan: Backend tests speed: autouse memory cache fixture and test-policy check script

Issue: [1789-backend-tests-speed-autouse-memory-cache-fixture-and-test-policy-check-script.md](../../issues/1789-backend-tests-speed-autouse-memory-cache-fixture-and-test-policy-check-script.md)

## Overview

Replace the 30 manual `memory_cache.clear()` calls in 15 test files with one autouse fixture in
`backend/conftest.py` that clears the cache before each test, fixing any test that depended on
leftover cache state. Add `backend/bin/check_test_policy.py`, a stdlib + `ast` script with one
function per rule, whose first rule forbids `memory_cache.clear()` in test files (with an inline
opt-out), and run it in the `checks` CI job. #1790 and #1793 add their rules to the same script.

## Agents involved

- [backend](backend.md)
- [infra](infra.md)

## Shared contracts

- **Script path:** `backend/bin/check_test_policy.py` (owned by `backend`).
- **Invocation:** from the backend root (the folder holding `pyproject.toml`), with no arguments:
  `poetry run python bin/check_test_policy.py`. It reads `testpaths` from `pyproject.toml` in the
  current directory (`tomllib`), so it works both in `backend/` and in the `checks` job, which
  copies `backend/*` to the repository root.
- **Exit codes:** `0` when there is no violation (honoured opt-outs are printed but never fail),
  `1` when there is at least one violation, `2` on a usage/configuration error (e.g. no
  `pyproject.toml`).
- **Output:** one line per violation, `path:line: rule-id: message`, then a summary line. Opt-outs
  are listed as `path:line: rule-id: allowed (opt-out)`.
- **Dependencies:** standard library only, so `poetry install` in the `checks` job is enough.
- **Local run:** `docker-compose run --rm majora_tests poetry run python bin/check_test_policy.py`.
