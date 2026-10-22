# Issue: Scoped API tokens: scope declarations for game photos

## Description

Sub-issue of #1603 (epic #1592), split out of #1630. Declare token scopes on the two game photo views, the last entries left in `PENDING_TOKEN_SCOPES` (`backend/accounts/tests/token_scopes_coverage_test.py`). Photos follow their parent family (`games`), per [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md):

| Route (URL name) | View | Method | Scopes |
|---|---|---|---|
| `games/<slug>/photos.json` (`game-photos`) | `backend/games/views/games/game_photos.py` | GET | `[]` (public, `AllowAny`, ready photos only) |
| `games/<slug>/photo_upload.json` (`game-photo-upload`) | `backend/games/views/photo_upload.py` | POST | `games:write` |

Finalizing a game photo upload (`PATCH uploads/<type>/<id>.json`) is already handled by #1639 (`GamePhoto` maps to `games` in `backend/uploads/upload_token_scope_check.py`).

## Problem

Until these two views are declared, every scoped token gets `403 token_not_allowed` on them (fail closed), so a token cannot list or upload game photos even with the right scopes. They are also the only reason `PENDING_TOKEN_SCOPES` still exists.

## Expected Behavior

- `game-photos` declares `@token_scopes(GET=[])`: a scoped token with no scopes can read it, and the token's game list still applies (`403 game_not_allowed` for a game not on the list).
- `game-photo-upload` declares `@token_scopes(POST=['games:write'])`: without `games:write` it gives `403 scope_missing`; for a game not on the token's list it gives `403 game_not_allowed`; and `check_game_edit` still runs as the owner, so a token with `games:write` whose owner cannot edit the game is still refused.
- Session and legacy-token behaviour does not change.

## Acceptance criteria

- Both views declare `@token_scopes`.
- This is the last sub-issue of #1603, so `PENDING_TOKEN_SCOPES` is deleted from the coverage test, along with the pending-only tests (`test_pending_entries_exist`, `test_pending_entries_are_not_covered_or_excluded`) and the pending branch of `_is_accounted_for`. Every DRF view must now be excluded or fully declared.
- Tests cover a public read without scopes, a missing `games:write` (403 `scope_missing`), a wrong game (403 `game_not_allowed`), and the owner-role intersection (a non-editor's token with `games:write` still cannot upload).
- `docs/agents/access-control/token-scopes.md` is updated: the Status paragraph says every view is declared (no pending list), and the Coverage test and "Declaring scopes on a view" sections no longer mention `PENDING_TOKEN_SCOPES`.

## Solution

- Add the `@token_scopes` decorators above `@api_view` on both views.
- Remove the pending set and its tests from `token_scopes_coverage_test.py`, keeping `test_every_view_is_declared_excluded_or_pending` as a plain "declared or excluded" check (renamed to match).
- Add the scoped-token tests next to the existing tests for each view.
- Update `token-scopes.md` as above.
