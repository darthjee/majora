# Remove the views from the pending set
Remove the 12 treasure URL names from `PENDING_TOKEN_SCOPES`: `game-treasures`, `game-treasures-all`, `game-treasures-missing`, `game-treasure-link`, `game-treasure-detail`, `game-treasure-full`, `treasures-list`, `treasure-detail`, `treasure-access`, `treasure-photo-upload`, `permissions-treasure`, `permissions-game-treasure`. Keep the set itself, because #1638, #1639 and #1669 still have entries there. `test_pending_entries_are_not_covered_or_excluded` fails if a declared view is left in the set.

## Files to Change
- `backend/accounts/tests/token_scopes_coverage_test.py` — drop the 12 names.
