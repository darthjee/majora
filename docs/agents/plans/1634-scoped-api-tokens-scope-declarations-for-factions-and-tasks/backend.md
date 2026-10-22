# Backend Plan: Scoped API tokens: scope declarations for factions and tasks

Main plan: [plan.md](plan.md)

## Overview
Follow the pattern of #1633 (documents): add `@token_scopes(...)` (from `games.decorators`) to each view, remove the URL names from `PENDING_TOKEN_SCOPES`, add an end-to-end test module per family built on `ScopedTokenMixin`, and record the families as declared in `docs/agents/access-control/token-scopes.md`.

## Context
Declarations to add (issue's Expected Behavior table):

| View (URL name) | Declaration |
|---|---|
| `game_factions` (`game-factions`) | `GET=[]`, `POST=['factions:write']` |
| `game_faction_detail` (`game-faction-detail`) | `GET=[]`, `PATCH=['factions:write']` |
| `game_faction_photo_upload` (`game-faction-photo-upload`) | `POST=['factions:write']` |
| `game_faction_characters` (`game-faction-characters`) | `GET=[]` |
| `game_faction_characters_all` (`game-faction-characters-all`) | `GET=['factions:read', 'pcs:read', 'npcs:read']` |
| `game_faction_permissions` (`permissions-game-faction`) | `GET=[]` |
| `game_tasks_list` (`game-tasks-list`) | `GET=['tasks:read']`, `POST=['tasks:write']` |
| `game_task_detail` (`game-task-detail`) | `GET=['tasks:read']`, `PATCH=['tasks:write']` |

## Steps

- [01 — Declare scopes on faction and task views](backend/01-declare-scopes.md)
- [02 — Add end-to-end token scope tests](backend/02-token-scope-tests.md)
- [03 — Update the token-scopes doc](backend/03-update-doc.md)

## CI Checks
- `backend`: `make tests` / the backend test and lint jobs via docker-compose (CI jobs with `working_directory: ~/project/backend`)

## Notes
- Decorator placement: match the document views (`@token_scopes` sits next to `@api_view`); the task views also carry `@restricted` — keep it, and place `@token_scopes` the same way as on other `@restricted` views already declared (e.g. the NPC `full.json` views).
- `permissions/game_faction.json` has no `game_slug`, so it gets no `game_not_allowed` test.
- The faction→PC/NPC summary routes are already declared (#1631/#1632); leave them alone. Other `permissions/*.json` routes belong to #1662.
- Faction photo finalize stays with #1639.
- Do not delete `PENDING_TOKEN_SCOPES` unless it becomes empty.
