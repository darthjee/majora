# Update token-scopes.md

- **Status:** record the games (`games.json`, `my-games.json`, `games/<slug>.json`, `access.json`, `permissions/game.json`), players and conversations families as declared (#1630). Keep the list of still-pending work accurate (#1636–#1639, #1665, #1666).
- **Read scopes:** add that `my-games.json` needs `games:read` alone (the caller's own membership summary; its PC and unread counts need no `pcs:read` / `conversations:read`), and that `conversations.json` needs `conversations:read` **and** `players:read` (its `player_id` 404s reveal player existence).
- **Per-game restriction:** replace "`my-games.json` must be filtered … when it is declared (#1630)" with the actual behaviour, and note that `games.json` POST needs `games:write` with no game-list check.

## Files to Change
- `docs/agents/access-control/token-scopes.md` — Status, Read scopes and Per-game restriction sections.
