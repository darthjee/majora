# Declare PC sub-collection views
Wrap every factory-built view under `pcs/detail/{documents,factions,items,possessions,recipes,treasures}/`
with `token_scopes(...)`, following the per-family table in [backend.md](../backend.md#declaration-table):
plain reads `[]`; `all`/`full`/`available/all`/`files/all`/`photos/all` → `pcs:read` + the family's
`read`; plain `acquire`/`remove`/`buy`/`sell` and the list `POST`/detail `PATCH` → `pcs:write`;
`acquire/all`/`remove/all`/`buy/all` → `pcs:write` + the family's `read`. `game_pc_item_photo_upload`
→ `POST=['pcs:write', 'items:write']`; recipe detail `PATCH` → `['pcs:write', 'recipes:read']`.
Check each factory's served methods first, so every declared method matches.

## Files to Change
- `backend/games/views/game/pcs/detail/documents/**/*.py` — wrap each factory call (`documents` family).
- `backend/games/views/game/pcs/detail/factions/**/*.py` — wrap each factory call (`factions`).
- `backend/games/views/game/pcs/detail/items/**/*.py` (not the summaries) — wrap each factory call (`items`).
- `backend/games/views/game/pcs/detail/possessions/**/*.py` — wrap each factory call (`possessions`).
- `backend/games/views/game/pcs/detail/recipes/**/*.py` — wrap each factory call (`recipes`).
- `backend/games/views/game/pcs/detail/treasures/**/*.py` (not the summaries) — wrap each factory call (`treasures`).
