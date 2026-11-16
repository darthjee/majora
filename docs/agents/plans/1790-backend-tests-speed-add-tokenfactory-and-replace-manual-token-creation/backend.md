# Backend Plan: Backend tests speed: add TokenFactory and replace manual token creation

Main plan: [plan.md](plan.md)

## Overview

One PR, no behavior change: every token is still created where it is today (`setUp`,
`setUpTestData` or a local variable). Moving per-test tokens into `setUpTestData` is out of
scope (Epic #1785 conversions).

## Context

- DRF `rest_framework.authtoken.models.Token`; `Token.save()` generates `key` when it is empty.
- 1,275 calls in 287 files under `accounts`, `games`, `miniatures`, `staff`, `statistics`,
  `uploads` and `versioning` tests. 10 are helper modules, not `*_test.py` files:
  - `games/tests/views/game/_character_recipe_exchange_fixtures.py`
  - `games/tests/views/game/_character_recipe_fixtures.py`
  - `games/tests/views/game/_permissions_token_scopes_behavior.py`
  - `games/tests/views/game/_scoped_token_fixtures.py`
  - `games/tests/views/game/recipes/detail/_recipe_characters_fixtures.py`
  - `games/tests/views/game/recipes/recipe_write_support.py`
  - `games/tests/views/games/_entity_token_scopes_behavior.py`
  - `staff/tests/copy_test_support.py`
  - `staff/tests/photo_test_support.py`
  - `uploads/tests/fixtures.py`
- Out of scope, never touched: `ApiToken.objects.create_token` and
  `PasswordResetToken.objects.create` in app code (and any test use of them).
- `bin/check_test_policy.py` (#1789) scans `*_test.py` and `conftest.py` under the `testpaths` in
  `pyproject.toml`, plus the root `conftest.py`; it runs in the `checks` CI job. It has no unit
  tests today.

## Steps

- [01 — Add TokenFactory](backend/01-token-factory.md)
- [02 — Codemod the call sites](backend/02-codemod.md)
- [03 — Check script rule and scope](backend/03-check-script.md)
- [04 — Docs, verification and timings](backend/04-docs-and-verify.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests poetry run pytest` (CI jobs: `pytest_views`,
  `pytest_non_views`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` and
  `docker-compose run --rm majora_tests poetry run python bin/check_test_policy.py` (CI job:
  `checks`)

## Notes

- The diff is large (287 files) but mechanical; review the codemod's rules and the list of
  hand-converted calls, not each file.
- The issue says the new rule gets tests "like the existing rule", but the existing rule has
  none. Verify both rules by running the script on the tree and on a scratch file with a
  violation (step 03); don't add a test suite for the script in this PR.
- Speed is not expected to change (still one `INSERT` per token); hypothesis 4 stays open.
