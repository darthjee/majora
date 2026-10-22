# Add miniatures token-scope tests

Create `backend/miniatures/tests/views/miniatures_token_scopes_test.py` (docstring: end-to-end tests for the `@token_scopes` declarations of the miniatures views, issue #1638). Model it on `treasures_token_scopes_test.py`: a `MiniaturesScopedTokenMixin(ScopedTokenMixin)` whose `setup_method` creates an `APIClient`, a `GameFactory` game (`self._member` needs `self.game`, and it is also used for the game-list case), a staff user, a regular user, and one `SourceFactory`, `StlModelFactory` and `CollectionFactory` record. Add small helpers for the create, import, `PATCH` and photo upload calls. Reuse the minimal valid payloads from the existing view tests in `backend/miniatures/tests/views/`.

Cover:
- **Reads**: for each of `sources.json`, `sources/<id>.json`, `stl_models.json`, `stl_models/<id>.json`, `collections.json` and `collections/<id>.json`, a token with only `miniatures:write` (or no scopes) gets `403 scope_missing`, and a regular user's token with `miniatures:read` gets `200`. Also check that `X-Skip-Cache` is still `true` on a scoped read.
- **Writes**: for each of the creates, both imports, the STL model `PATCH` and the three photo upload inits, a staff token with only `miniatures:read` gets `scope_missing`, and a staff token with `miniatures:write` succeeds (`201` / `200`, matching the existing view tests).
- **Owner-role intersection**: a regular (non-staff) user holding `miniatures:write` still gets the role `403` (`_assert_role_refused`) on a create, an import and a photo upload init.
- **No game restriction**: a token with `games=[self.game]` and `miniatures:read` still reads `stl_models.json` with `200`, since these routes have no game slug.
- **Unchanged credentials**: a session login (`_log_in`) and a legacy `Token` header still read and (as staff) write without any scopes.

Group the tests into a few classes (reads, writes, role intersection, other credentials), as the treasures module does.

## Files to Change
- `backend/miniatures/tests/views/miniatures_token_scopes_test.py` — new end-to-end test module
