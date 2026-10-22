# Backend Plan: Scoped API tokens: scope declarations for miniatures

Main plan: [plan.md](plan.md)

## Overview
Declare token scopes on every `miniatures` view (sources, STL models and collections, with their imports and photo upload inits), following `docs/agents/access-control/token-scopes.md`. No miniatures read is `AllowAny`, so every `GET` needs `miniatures:read` and every write needs `miniatures:write`. These routes have no `game_slug`, so there is no per-game check.

## Context
- The decorator is `games.decorators.token_scopes`. It is applied **above** `@api_view`, as in `backend/games/views/polls/game_poll_votes.py`: `@token_scopes(GET=['polls:read'], PUT=['polls:write'])`.
- `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py` lists the 11 miniatures URL names. `test_pending_entries_are_not_covered_or_excluded` fails if a declared view stays on the list, so declarations and removals must land together.
- Every write keeps `require_staff`, so a scoped token never goes beyond its owner's role.
- The test helpers are `games.tests.views.game._scoped_token_fixtures.ScopedTokenMixin` (`_get`, `_post`, `_patch`, `_assert_refused`, `_assert_role_refused`, `_log_in`). The closest precedent is `backend/games/tests/views/treasures/treasures_token_scopes_test.py`, which tests top-level routes with no game slug.
- The miniatures factories are in `backend/miniatures/tests/factories/__init__.py` (`SourceFactory`, `StlModelFactory`, `CollectionFactory`, …).

## Steps

- [01 — Declare scopes on the miniatures views](backend/01-declare-scopes.md)
- [02 — Add miniatures token-scope tests](backend/02-add-token-scope-tests.md)
- [03 — Update the token-scopes doc](backend/03-update-token-scopes-doc.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest miniatures/tests accounts/tests` (CI jobs: the backend `Tests` jobs in `.circleci/config.yml`)
- `backend`: the repo's backend lint (flake8 / pylint, per `AGENTS.md`), so docstrings and line length match the existing test modules

## Notes
- Do not delete `PENDING_TOKEN_SCOPES` unless it is empty after this change. Today it still holds `game-photo-upload`, `game-photos` (#1665), `permissions-game-*` (#1666) and `upload-finalize` (#1639). If those have landed by the time this branch merges with `main`, delete the set and its two pending-only tests (`test_pending_entries_exist`, `test_pending_entries_are_not_covered_or_excluded`), and simplify `_is_accounted_for`.
- Upload finalize for `SourcePhoto` / `StlModelPhoto` / `CollectionPhoto` is out of scope (#1639).
- The crawler uses a legacy `Token`, so it is unaffected.
- Every miniatures response sets `X-Skip-Cache`, so no cache-warmer (`navi/`) change is needed.
