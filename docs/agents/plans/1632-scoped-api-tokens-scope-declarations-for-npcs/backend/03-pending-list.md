# Remove NPC views from the pending list

Remove every `game-npc-*`, `game-npcs*` and reverse-nested NPC summary entry from the pending list: `game-document-npc-summary(-all)`, `game-faction-npc-summary(-all)`, `game-item-npc-summary(-all)` and `game-treasure-npc-summary(-all)`. Keep `permissions-game-npc`. Then run the coverage test. It must pass, which proves every NPC route declares every method it serves.

## Files to Change
- `backend/accounts/tests/token_scopes_coverage_test.py` — drop the NPC entries.
