# Remove document views from the pending list

Remove the 18 `game-document*` / `game-documents*` names listed in step 01 from `PENDING_TOKEN_SCOPES`. Keep `permissions-game-document` there. `test_pending_entries_are_not_covered_or_excluded` and `test_every_view_is_declared_excluded_or_pending` must pass.

## Files to Change
- `backend/accounts/tests/token_scopes_coverage_test.py` — drop the documents entries.
