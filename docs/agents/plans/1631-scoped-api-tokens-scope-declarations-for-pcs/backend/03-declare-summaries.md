# Declare PC summary views
The reverse-nested summaries (`games/<slug>/{documents,factions,items,treasures}/<id>/pcs/<character_id>/summary[/all].json`)
belong to this issue. Add `@token_scopes` as the top decorator: plain `summary` → `GET=[]`;
`summary/all` (decorated `@restricted`) → `GET=['pcs:read', '<family>:read']`.

## Files to Change
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_summary.py` / `_summary_all.py` — `[]` / `['pcs:read', 'documents:read']`.
- `backend/games/views/game/pcs/detail/factions/detail/game_pc_faction_summary.py` / `_summary_all.py` — `[]` / `['pcs:read', 'factions:read']`.
- `backend/games/views/game/pcs/detail/items/detail/game_pc_item_summary.py` / `_summary_all.py` — `[]` / `['pcs:read', 'items:read']`.
- `backend/games/views/game/pcs/detail/treasures/detail/game_pc_treasure_summary.py` / `_summary_all.py` — `[]` / `['pcs:read', 'treasures:read']`.
