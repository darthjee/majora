# Backend Plan: Scoped API tokens: scope declarations for NPCs

Main plan: [plan.md](plan.md)

## Overview
The NPC view tree under `backend/games/views/game/npcs/` mirrors `pcs/` file by file. Most views are thin wrappers around shared builders (`build_*_view(npc=True)`), so each NPC view takes the same declaration as its PC counterpart, with `pcs:` replaced by `npcs:`. Five views have no PC counterpart and need their own declarations (step 02). The PC commit `386f3465` (#1631) is the reference: `git show 386f3465`.

## Context
- Decorator: `@token_scopes` in `backend/games/decorators.py`. It is applied as `name = token_scopes(...)(build_...)` on builder-based views, and as a decorator above `@api_view` on function views. Follow the PC file for each one.
- Rules: `docs/agents/access-control/token-scopes.md`.
- Coverage test and pending list: `backend/accounts/tests/token_scopes_coverage_test.py`.
- PC end-to-end tests to mirror: `backend/games/tests/views/game/pcs/token_scopes_test.py`.

## Steps

- [01 — Declare scopes on NPC views that mirror PC views](backend/01-mirror-pc-declarations.md)
- [02 — Declare scopes on NPC-only views](backend/02-npc-only-views.md)
- [03 — Remove NPC views from the pending list](backend/03-pending-list.md)
- [04 — Add end-to-end NPC token-scope tests](backend/04-tests.md)
- [05 — Update the token-scopes doc status](backend/05-doc-status.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests poetry run pytest games/tests/views/game/npcs accounts/tests` (CI jobs: `pytest_views_characters`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes
- Out of scope: `permissions-game-npc` stays on the pending list, as `permissions-game-pc` did in #1631. Upload finalize belongs to #1639.
- Before declaring each view, check its `@api_view([...])` method list, and declare every method it serves. The coverage test fails on any missing method.
- `npcs/<id>/recipes/available.json` is permission-gated, like its PC counterpart. It is a restricted read (`npcs:read` + `recipes:read`), not a public read. Check every other `available` builder for the same gate.
- Delete the pending list only if every other #1603 sub-issue has already landed when this one merges. That is not expected: #1630 and #1633–#1639 are still open.
- Reviews: `security` and `data-access`.
