# Items and possessions

Declare scopes on the items and possessions views, and test them.

| View | Declaration |
|---|---|
| `game_items` | `GET=[]`, `POST=['items:write']` |
| `game_items_all` | `GET=['items:read']` |
| `game_item_detail` | `GET=[]`, `PATCH=['items:write']` |
| `game_item_detail_full` | `GET=['items:read']` |
| `game_item_photo_upload` | `POST=['items:write']` |
| `game_item_permissions` | `GET=[]` |
| `game_possessions` | `GET=[]`, `POST=['possessions:write']` |
| `game_possessions_all` | `GET=['possessions:read']` |
| `game_possession_detail` | `GET=[]`, `PATCH=['possessions:write']` |
| `game_possession_detail_full` | `GET=['possessions:read']` |
| `game_possession_photo_upload` | `POST=['possessions:write']` |
| `game_possession_permissions` | `GET=[]` |

Tests (one module per family, using `ScopedTokenMixin` from
`games/tests/views/game/_scoped_token_fixtures.py`): public list/detail/permissions without
scopes → 200; `all`/`full` without `read` → `scope_missing`, with it → 200 for the DM; a player
token holding `read` on `all.json` still gets the owner's role refusal (`_assert_role_refused`);
POST/PATCH/photo upload without `write` → `scope_missing`, with it → success; a token limited to
another game → `game_not_allowed`.

## Files to Change
- `backend/games/views/games/game_items.py`, `game_items_all.py`, `game_item_detail.py`, `game_item_detail_full.py`, `game_item_photo_upload.py` — add `@token_scopes`
- `backend/games/views/games/game_possessions.py`, `game_possessions_all.py`, `game_possession_detail.py`, `game_possession_detail_full.py`, `game_possession_photo_upload.py` — add `@token_scopes`
- `backend/games/views/permissions/game_item_permissions.py`, `game_possession_permissions.py` — add `@token_scopes(GET=[])`
- `backend/games/tests/views/games/game_items_token_scopes_test.py` — new
- `backend/games/tests/views/games/game_possessions_token_scopes_test.py` — new
