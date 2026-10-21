# Per-family token-scope tests
Add end-to-end tests that call real PC routes with `APIClient` and an `Authorization: Bearer <plain>`
header (tokens from `ApiToken.objects.create_token(owner, name, scopes, games=…)`). Cover:
- missing scope → 403 `scope_missing` (e.g. `pcs/<id>/full.json` with only `npcs:read`);
- wrong game → 403 `game_not_allowed` (token limited to another game);
- a public read with no scopes (`pcs.json`, `pcs/<id>.json` with `scopes=[]`) → 200;
- a restricted multi-family read: `pcs/<id>/items/<item>/full.json` with `pcs:read` alone → `scope_missing`, with `pcs:read`+`items:read` → 200 for the owner/DM;
- link writes: `items/acquire.json` with `pcs:write` → succeeds; `documents/acquire/all.json` with only `pcs:write` → `scope_missing`, with `documents:read` added → succeeds;
- `items/<item>/photo_upload.json` needs both `pcs:write` and `items:write`;
- a summary-all route needs `pcs:read` plus its family's read;
- owner-role intersection: a token with full `pcs:*` held by a non-owner player still gets the view's normal 403/404 on `full.json` / `items/all.json`;
- session and legacy `Token` requests to the same routes behave as before (no scopes involved).
Keep any small helper (build a Bearer client for a token) local to the test package, unless a sibling sub-issue already added a shared one.

## Files to Change
- `backend/games/tests/views/game/pcs/token_scopes_test.py` — new: the per-family tests above.
