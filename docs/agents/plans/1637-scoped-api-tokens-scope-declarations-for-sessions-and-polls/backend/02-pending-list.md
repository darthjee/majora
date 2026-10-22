# Remove entries from the pending list

Remove the 11 URL names (`game-poll-close`, `game-poll-detail`, `game-poll-votes`,
`game-polls-list`, `game-session-detail`, `game-session-poll-create`, `game-sessions-future`,
`game-sessions-list`, `game-sessions-past`, `game-sessions-unscheduled`,
`session-messages-list`) from `PENDING_TOKEN_SCOPES`. Keep the set (other entries remain).

## Files to Change

- `backend/accounts/tests/token_scopes_coverage_test.py` — drop the 11 entries.
