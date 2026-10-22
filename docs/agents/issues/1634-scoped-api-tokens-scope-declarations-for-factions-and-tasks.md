# Issue: Scoped API tokens: scope declarations for factions and tasks

## Description

Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on the `factions` and `tasks` families (`games/<slug>/factions…` and `games/<slug>/tasks…`), following the read/write/link rules in [`docs/agents/access-control/token-scopes.md`](https://github.com/darthjee/majora/blob/main/docs/agents/access-control/token-scopes.md), the same way #1631 (PCs), #1632 (NPCs) and #1633 (documents) did for their families.

**Blocked by:** #1616 and the #1603 core (both merged).

The faction→PC/NPC summary routes (`factions/<id>/pcs|npcs/<character_id>/summary[/all].json`) were already declared by #1631/#1632 and are out of scope. The other `permissions/*.json` routes still pending (`game_pc`, `game_npc`, `game_document`, items, treasures, …) are tracked separately in #1662.

## Expected Behavior

| URL name | Route | Method | Scopes |
|---|---|---|---|
| `game-factions` | `factions.json` | GET | `[]` (public) |
| | | POST | `factions:write` |
| `game-faction-detail` | `factions/<id>.json` | GET | `[]` (public) |
| | | PATCH | `factions:write` |
| `game-faction-photo-upload` | `factions/<id>/photo_upload.json` | POST | `factions:write` |
| `game-faction-characters` | `factions/<id>/characters.json` | GET | `[]` (public, non-hidden characters only) |
| `game-faction-characters-all` | `factions/<id>/characters/all.json` | GET | `factions:read`, `pcs:read`, `npcs:read` (restricted, includes hidden PCs and NPCs) |
| `permissions-game-faction` | `permissions/game_faction.json` | GET | `[]` (public; only reports what the caller's role may do) |
| `game-tasks-list` | `tasks.json` | GET | `tasks:read` (restricted; tasks have no public read) |
| | | POST | `tasks:write` |
| `game-task-detail` | `tasks/<id>.json` | GET | `tasks:read` |
| | | PATCH | `tasks:write` |

- A task's nested `session` only exposes `id` and `title`, which the public sessions routes already show, so task routes do not need `sessions:read`. Setting a task's session is a link write on the owning family (`tasks:write` only).
- Faction photo finalize (`PATCH uploads/…` on a `GameFactionPhoto`) stays with #1639, whose "others → the attached resource's family" rule maps it to `factions:write`.

## Solution

- Add `@token_scopes(...)` to the eight views above (`backend/games/views/games/game_faction*.py`, `backend/games/views/game_tasks/*.py` and the `game_faction_permissions` view behind `permissions/game_faction.json`) and remove their URL names from `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`.
- Add end-to-end token-scope tests, like `game_documents_token_scopes_test.py`, covering: a missing scope (403 `scope_missing`), a wrong game (403 `game_not_allowed`), a public read with no scopes, the multi-family `characters/all.json` read (fails without `pcs:read` or `npcs:read`), a write with `factions:write` / `tasks:write`, and the owner-role intersection (a non-DM owner's token with `tasks:read` still gets 403 on tasks).
- Update the Status paragraph of `docs/agents/access-control/token-scopes.md` to record the factions and tasks families as declared.
- Session and legacy-token behaviour does not change. If this is the last sub-issue of #1603 to land, delete the pending list.

## Benefits

Automations can manage factions and campaign tasks with least-privilege tokens, for example a task tracker that holds `tasks:write` without access to characters or documents.
