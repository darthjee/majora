# Remove PC views from the pending list
Delete every `game-pc-*`, `game-pcs` and `game-{document,faction,item,treasure}-pc-summary[-all]`
entry from `PENDING_TOKEN_SCOPES`. Leave `permissions-game-pc` in place. If the set ends up empty,
delete it and its use in the coverage test. Run the coverage test to confirm every PC view
declares every method it serves.

## Files to Change
- `backend/accounts/tests/token_scopes_coverage_test.py` — drop the PC entries from `PENDING_TOKEN_SCOPES`.
