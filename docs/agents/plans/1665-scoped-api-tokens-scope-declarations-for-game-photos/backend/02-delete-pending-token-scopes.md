# Delete PENDING_TOKEN_SCOPES

With both photo views declared, the pending set is empty and goes away:

- Delete the `PENDING_TOKEN_SCOPES` constant and its "TEMPORARY" comment.
- In `_is_accounted_for`, drop the `or entry.name in PENDING_TOKEN_SCOPES` branch, and update its
  docstring ("excluded or fully declared").
- Rename `test_every_view_is_declared_excluded_or_pending` to
  `test_every_view_is_declared_or_excluded` and update its docstring.
- Delete `test_pending_entries_exist` and `test_pending_entries_are_not_covered_or_excluded`.
- Update the module docstring (no "or is pending").

## Files to Change
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the pending set and its tests.
