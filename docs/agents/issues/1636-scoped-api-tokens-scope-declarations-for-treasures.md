# Issue: Scoped API tokens: scope declarations for treasures

## Description
Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on every view of the `treasures` family: the game copies under `games/<slug>/treasures…` (game-scoped) and the top-level `treasures/…` catalogue routes (no `game_slug`, so scopes only and no game-list check). Follow the family table and the read/write/link rules in [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md).

**Blocked by:** #1616 and the #1603 core (catalogue, decorator, auth-class check, coverage test with a pending list), all merged.

## Problem
These views are still on the temporary `PENDING_TOKEN_SCOPES` set in `backend/accounts/tests/token_scopes_coverage_test.py`, so scoped tokens get 403 `token_not_allowed` on all of them. An automation can't read or manage treasures.

The PC/NPC treasure summary routes (`games/<slug>/treasures/<id>/{pcs,npcs}/<id>/summary…`) are already declared and are out of scope here. The other leftover pending views (`permissions-game-pc`, `permissions-game-npc`, `permissions-game-document`, `game-photos`, `game-photo-upload`) are handled in #1669.

## Expected Behavior
| Route (URL name) | Declaration |
|---|---|
| `games/<slug>/treasures.json` (`game-treasures`) | `GET=[]` (public, hidden excluded); `POST=[treasures:write]` |
| `games/<slug>/treasures/all.json` (`game-treasures-all`) | `GET=[treasures:read]` (edit-gated, includes hidden) |
| `games/<slug>/treasures/missing.json` (`game-treasures-missing`) | `GET=[treasures:read]` (edit-gated) |
| `games/<slug>/treasures/link.json` (`game-treasure-link`) | `POST=[treasures:write]` (owning family; linked catalogue treasure is the same family) |
| `games/<slug>/treasures/<id>.json` (`game-treasure-detail`) | `GET=[]` (strict hidden gate, #1616); `PATCH=[treasures:write]` |
| `games/<slug>/treasures/<id>/full.json` (`game-treasure-full`) | `GET=[treasures:read]` |
| `treasures.json` (`treasures-list`) | `GET=[]`; `POST=[treasures:write]` |
| `treasures/<id>.json` (`treasure-detail`) | `GET=[]`; `PATCH=[treasures:write]` |
| `treasures/<id>/access.json` (`treasure-access`) | `GET=[]` |
| `treasures/<id>/photo_upload.json` (`treasure-photo-upload`) | `POST=[treasures:write]` |
| `permissions/treasure.json` (`permissions-treasure`) | `GET=[]` |
| `permissions/game_treasure.json` (`permissions-game-treasure`) | `GET=[]` |

- Game-scoped routes enforce the token's game list (403 `game_not_allowed`); top-level `treasures/…` and `permissions/…` routes have no `game_slug` and are governed by scopes alone.
- A scope never lets a token exceed its owner: e.g. `treasures:write` on a non-DM owner still fails `check_game_edit`, and top-level `PATCH treasures/<id>.json` stays superuser-only.
- Session and legacy-token behaviour does not change.

## Solution
- Add `@token_scopes(...)` (from `backend/games/decorators.py`) to each view in the table: `backend/games/views/games/game_treasure*.py`, `backend/games/views/treasures/*.py` and the two treasure views in `backend/games/views/permissions/`.
- Remove these 12 URL names from `PENDING_TOKEN_SCOPES`: `game-treasures`, `game-treasures-all`, `game-treasures-missing`, `game-treasure-link`, `game-treasure-detail`, `game-treasure-full`, `treasures-list`, `treasure-detail`, `treasure-access`, `treasure-photo-upload`, `permissions-treasure`, `permissions-game-treasure`. #1638, #1639 and #1669 are still open, so the set is not deleted here unless this lands last.
- Per-family tests, following the pattern of the merged sibling sub-issues (#1630–#1637):
  - missing scope → 403 `scope_missing` (e.g. `all.json` without `treasures:read`, `link.json` without `treasures:write`);
  - wrong game → 403 `game_not_allowed` on a game-scoped route;
  - public reads (game `treasures.json`, detail, top-level list/detail/access, permissions) succeed with a token carrying no scopes;
  - top-level routes with a game-restricted token are not rejected for the game list;
  - owner-role intersection: a token with `treasures:write` whose owner is not a DM/superuser still gets the existing 403.
- Reviews: `security` and `data-access`.

## Benefits
Treasure management (catalogue and per-game copies) becomes reachable to least-privilege automation tokens, and one more group leaves the fail-closed pending list.
