# Add end-to-end NPC token-scope tests

Create `backend/games/tests/views/game/npcs/token_scopes_test.py` by mirroring the PC test classes (reuse or copy `ScopedTokenRequestMixin`; if you copy it, consider extracting it to a shared test helper). Cover:

- **Public reads:** `npcs.json` and `npcs/<id>.json` with a token that has no scopes. Also a `PATCH npcs/<id>.json` (player update) that needs `npcs:write`.
- **Refusals:**
  - `npcs/<id>/full.json` with only `pcs:read` gets 403 `scope_missing`. This proves PC and NPC scopes are separate.
  - A token limited to another game gets 403 `game_not_allowed`.
- **Hidden NPCs:**
  - `npcs/all.json` needs `npcs:read`.
  - Owner intersection: a player's token that has `npcs:read` still can't read `npcs/all.json`.
  - `npcs/full.json` `POST` needs `npcs:write`.
- **Restricted multi-family reads:** `npcs/<id>/items/<item>/full.json` needs `npcs:read` + `items:read`. `npcs/<id>/treasures/all.json` needs `treasures:read` too.
- **Link writes:** `items/acquire.json` works with `npcs:write` alone. `documents/acquire/all.json` also needs `documents:read`. `remove/all.json` follows the same rule.
- **Cross-family creates:** `items.json` and `possessions.json` `POST`, and the per-item photo upload, need the second family's `write`.
- **Reverse-nested summaries:** the plain summary needs no scope; the `-all` summary needs both reads.
- **Photos:** `photos/all.json` needs `npcs:read`. Photo upload needs `npcs:write`.
- **Other credentials:** session and legacy-token requests behave as before, for both owner and non-owner.

## Files to Change
- `backend/games/tests/views/game/npcs/token_scopes_test.py` — new.
