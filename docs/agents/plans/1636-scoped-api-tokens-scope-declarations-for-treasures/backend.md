# Backend Plan: Scoped API tokens: scope declarations for treasures

Main plan: [plan.md](plan.md)

## Overview
Declare token scopes on every pending view of the `treasures` family, following `docs/agents/access-control/token-scopes.md`, and prove them with end-to-end tests, as the merged sibling sub-issues (#1630–#1637) did.

## Context
- `TokenScopeCheck` (`backend/accounts/authentication.py`) reads `@token_scopes` from the resolved view and checks the game list only through the `game_slug` URL kwarg; it does no object lookups.
- These 12 URL names are still in `PENDING_TOKEN_SCOPES` (`backend/accounts/tests/token_scopes_coverage_test.py`): `game-treasures`, `game-treasures-all`, `game-treasures-missing`, `game-treasure-link`, `game-treasure-detail`, `game-treasure-full`, `treasures-list`, `treasure-detail`, `treasure-access`, `treasure-photo-upload`, `permissions-treasure`, `permissions-game-treasure`.
- The PC/NPC treasure summary routes are already declared. The leftover `permissions-game-pc/npc/document`, `game-photos` and `game-photo-upload` belong to #1669 and must stay pending.
- The spec says: "Routes game-scoped by other means must enforce the list in the view before they are declared." Top-level `treasures/<id>.json` `PATCH` and `treasures/<id>/photo_upload.json` `POST` can act on a game-exclusive treasure (`treasure.game_id` set) without a `game_slug`.

## Steps

- [01 — Declare scopes on game-scoped treasure views](backend/01-declare-game-treasure-scopes.md)
- [02 — Declare scopes on top-level treasure and permission views](backend/02-declare-top-level-treasure-scopes.md)
- [03 — Remove the views from the pending set](backend/03-remove-pending-entries.md)
- [04 — Test the game-scoped treasure declarations](backend/04-test-game-treasure-scopes.md)
- [05 — Test the top-level treasure and permission declarations](backend/05-test-top-level-treasure-scopes.md)
- [06 — Document the treasure declarations](backend/06-document-treasure-scopes.md)

## CI Checks
- `backend`: `make test` / the backend pytest and lint targets via `docker-compose` (CI jobs: backend tests, backend lint). See `AGENTS.md#development`.

## Notes
- Owner-role intersection matters most here: `treasures:write` must not let a non-DM pass `check_game_edit`, a DM pass the superuser/staff-only top-level `POST treasures.json`, or a non-admin pass the top-level `PATCH`. These checks run in the views and are unchanged.
- Public `GET` declarations (`[]`) rely on #1616's strict hidden gate (`game_treasure_detail` 404s hidden copies, `game_treasures` excludes them).
- Reviews: `security` and `data-access`.
- #1638, #1639 and #1669 are still open, so `PENDING_TOKEN_SCOPES` is not deleted here.
