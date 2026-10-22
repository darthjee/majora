# Wire it into finalize and declare the view

- In `backend/uploads/views.py`, add `@token_scopes(PATCH=[])` (from `games.decorators`) above `@api_view(['PATCH'])` on `upload_finalize`, stacked with `@restricted`. Add a short comment saying that the empty list only lets scoped tokens reach the view, and that `UploadTokenScopeCheck` enforces the real family scopes and game list.
- In `_validate_upload`, call `UploadTokenScopeCheck(request, upload).run()` after the token-match, owner, expiry and status checks and before `_check_permission`. The raised `ApiTokenForbidden` subclasses are rendered by `common/exception_handler.py` as `{"errors": {"detail": ["<code>"]}}`, the same as the authentication-class failures. Make sure DRF's exception handling covers this path (the function runs inside the `@api_view` body, so it does).
- Remove `'upload-finalize'` from `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`. If it becomes empty, delete the set and its uses, and update the module comment.

## Files to Change
- `backend/uploads/views.py` — declaration and call to the new check.
- `backend/accounts/tests/token_scopes_coverage_test.py` — drop the pending entry.
