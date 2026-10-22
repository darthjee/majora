# Backend Plan: Scoped API tokens: scope declarations for documents

Main plan: [plan.md](plan.md)

## Overview
Every view behind a `game-document*` / `game-documents*` URL name declares `@token_scopes` for each method it serves, using `documents:read` / `documents:write`. They leave `PENDING_TOKEN_SCOPES` and get end-to-end tests. The document serializers embed no other family, so no cross-family `read` is needed.

## Context
- Rules: `docs/agents/access-control/token-scopes.md` (public reads `GET=[]`; restricted reads need `read`; writes need `write` on the family they change; same-family writes need no extra `read`, as in `game_pc_full` `PATCH=['pcs:write']`).
- Reference implementations: #1631 (`backend/games/views/game/pcs/…`, `backend/games/tests/views/game/pcs/token_scopes_test.py`) and #1632 (`…/npcs/…`, shared helpers in `backend/games/tests/views/game/_scoped_token_fixtures.py`).
- Decorator: `from ...decorators import token_scopes` (package `games.decorators`), stacked above `@api_view`.

## Steps

- [01 — Declare scopes on document views](backend/01-declare-scopes.md)
- [02 — Remove document views from the pending list](backend/02-remove-pending.md)
- [03 — Add end-to-end token-scope tests](backend/03-token-scope-tests.md)
- [04 — Update the token-scopes doc](backend/04-update-docs.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ accounts/tests/token_scopes_coverage_test.py` (CI jobs: `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes
- Out of scope: `game-document-pc-summary(-all)` / `game-document-npc-summary(-all)` (done in #1631 / #1632), upload finalize (#1639), and `permissions-game-document` (stays pending, to be declared with the other `permissions/game_*.json` routes).
- If a view turns out to read restricted data of another family, add that family's `read` and note it in the doc (as #1631 did for `recipes/available`).
- Not the last sub-issue of #1603, so the pending set stays.
