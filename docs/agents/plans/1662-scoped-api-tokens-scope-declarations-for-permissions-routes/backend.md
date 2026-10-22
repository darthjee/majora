# Backend Plan: Scoped API tokens: scope declarations for permissions routes

Main plan: [plan.md](plan.md)

## Overview

Finish the scope declarations for the `permissions/*.json` routes. Exploration showed that six of
the nine routes in the issue (`permissions-game-item`, `permissions-game-common-item`,
`permissions-game-possession`, `permissions-game-recipe`, `permissions-game-treasure`,
`permissions-treasure`) already declare `@token_scopes(GET=[])`, are off `PENDING_TOKEN_SCOPES`
and have "needs no scope" tests (#1635, #1636). Only three remain:

- `permissions-game-pc` — `backend/games/views/permissions/game_pc_permissions.py`
- `permissions-game-npc` — `backend/games/views/permissions/game_npc_permissions.py`
- `permissions-game-document` — `backend/games/views/permissions/game_document_permissions.py`

## Context

`permissions/*.json` are public reads that only report what a role may do
([token-scopes.md](../../access-control/token-scopes.md#read-scopes)), so they need no scope. Their
output is identity-independent: it depends only on the `?role=` query parameter
(`parse_role_booleans` / `permissions_response` in `backend/games/views/common`). A token can
therefore never report more than its owner may do.

## Implementation Steps

### Step 1 — Declare the scopes and test them

- In each of the three view modules, import `token_scopes` from `...decorators` and add
  `@token_scopes(GET=[])` **above** `@api_view(['GET'])`, mirroring
  `game_faction_permissions.py`. The helper `_character_permissions.py` is not a view and stays
  unchanged.
- In `backend/accounts/tests/token_scopes_coverage_test.py`, remove `permissions-game-document`,
  `permissions-game-npc` and `permissions-game-pc` from `PENDING_TOKEN_SCOPES`. Keep
  `game-photo-upload` and `game-photos` (they belong to #1665).
- Add scoped-token tests (pytest style with `setup_method`, reusing `ScopedTokenMixin` from
  `backend/games/tests/views/game/_scoped_token_fixtures.py`) in the existing family files
  `backend/games/tests/views/game/pcs/token_scopes_test.py`,
  `backend/games/tests/views/game/npcs/token_scopes_test.py` and
  `backend/games/tests/views/games/game_documents_token_scopes_test.py` (inside their
  `...PublicReads` classes, or a new class next to them). For each route, cover:
  - a scoped token with no scopes gets `200`;
  - a no-scope token held by a DM (or superuser) still gets all-`False` without `?role=`, the same
    as anonymous — the token never adds rights;
  - with `?role=dm`, the scoped-token response equals the anonymous/legacy-token response;
  - session and legacy `Token` requests still return `200` (behaviour unchanged).

### Step 2 — Update the docs

Rewrite the tail of the **Status** paragraph in `docs/agents/access-control/token-scopes.md`:
credit #1662 for `permissions/game_pc.json`, `permissions/game_npc.json` and
`permissions/game_document.json` (the current text wrongly spells them `permissions/game/pc.json`
/ `permissions/game/npc.json` and attributes them to #1666), and leave only the game photos and
their upload init (#1665) as pending.

## Files to Change

- `backend/games/views/permissions/game_pc_permissions.py` — add `@token_scopes(GET=[])`
- `backend/games/views/permissions/game_npc_permissions.py` — add `@token_scopes(GET=[])`
- `backend/games/views/permissions/game_document_permissions.py` — add `@token_scopes(GET=[])`
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the three pending entries
- `backend/games/tests/views/game/pcs/token_scopes_test.py` — scoped-token tests for `permissions/game_pc.json`
- `backend/games/tests/views/game/npcs/token_scopes_test.py` — scoped-token tests for `permissions/game_npc.json`
- `backend/games/tests/views/games/game_documents_token_scopes_test.py` — scoped-token tests for `permissions/game_document.json`
- `docs/agents/access-control/token-scopes.md` — Status paragraph

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs split pytest across
  `games/tests/views/game/`, the rest of `games/tests/views/`, and everything else)
- `backend`: `docker-compose run --rm majora_tests ruff check .`
- docs: markdownlint (`yarn lint_md`, CI job `markdownlint`)

## Notes

- Six of the nine routes listed in the issue are already done; do not re-declare them.
- The decorator must sit above `@api_view`, otherwise a `ValueError` is raised at import time.
- `test_pending_entries_are_not_covered_or_excluded` fails if a declared view is left in
  `PENDING_TOKEN_SCOPES`, so steps must land together.
