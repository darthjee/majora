# Tests

Add `backend/uploads/tests/views_finalize_token_scopes_test.py`. Reuse `games.tests.views.game._scoped_token_fixtures.ScopedTokenMixin` (`_bearer`, `_patch`, `_assert_refused`, `_assert_role_refused`) and the upload setup patterns of `views_finalize_test.py` and `uploads/tests/fixtures.py`. Send `X-Upload-Token` with each request.

Cover:
- Family resolution from the linked object: a PC `CharacterPhoto` succeeds with `pcs:write` and fails with only `npcs:write` (`scope_missing`), and the NPC case is the reverse. `CharacterItemPhoto` needs both the character family and `items:write`. At least one non-character type (e.g. `GameDocumentPhoto` with `documents:write`) works, and `GamePhoto` needs `games:write`.
- A missing scope → `403` `scope_missing`.
- A wrong game (a token whose game list excludes the object's game) → `403` `game_not_allowed`. A token whose game list includes it → `200`.
- No game check for a catalogue `TreasurePhoto` and a miniatures photo (a staff owner with `miniatures:write` → `200`).
- A staff-origin and a copy-origin upload → `403` `token_not_allowed`, even with every scope.
- The owner-role intersection: a non-editor's token that has the scope gets a role `403` (`_assert_role_refused`).
- A unit test (no HTTP) on `UploadTokenScopeCheck` / `_SCOPE_RULES`: every key of `uploads.views._PHOTO_HANDLERS` plus `GamePhoto` has a rule, and every rule's scopes are in `accounts.scopes.SCOPES`.
- Session and legacy `Token` requests: the existing finalize test files must pass unchanged. Add one explicit legacy-token finalize test in the new file if none of the existing ones already covers it.

## Files to Change
- `backend/uploads/tests/views_finalize_token_scopes_test.py` — new end-to-end tests.
- `backend/uploads/tests/upload_token_scope_check_test.py` — new unit tests for the map.
