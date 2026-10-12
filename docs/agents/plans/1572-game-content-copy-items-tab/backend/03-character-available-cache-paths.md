# Character available-list cache paths
A reusable cache-path builder returning `/games/<slug>/<pcs|npcs>/<id>/<family>/available.json`
for **every** character of a game (`pcs` vs `npcs` via `photo_cache_paths.character_kind`),
ordered by character id, one query. `family` is a constructor argument (`items` here; other tabs
reuse it with their own family if their spec lists such paths). A game with no characters yields
`[]`. Hidden NPCs are included (clearing them is harmless, per `items.md`).

Tests: PCs and NPCs mapped to the right segment, no characters → `[]`, characters of other games
excluded, query count bounded.

## Files to Change
- `backend/staff/photo_cache_paths.py` — add the builder (e.g. `GameCharactersAvailableCachePaths`) next to `CharacterItemCachePaths`; or a new `backend/staff/copy_cache_paths.py` if that reads better.
- `backend/staff/tests/photo_cache_paths_test.py` (or a new `copy_cache_paths_test.py`) — its tests.
