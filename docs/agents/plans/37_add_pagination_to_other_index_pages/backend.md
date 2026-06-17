# Backend Plan: Add pagination to other index pages

Main plan: [plan.md](plan.md)

## Tasks

1. Update `source/games/views/games.py` — `games_list` view:
   - Apply `Paginator(request, Game.objects.all()).paginate()` (same pattern as `game_npcs`)
   - Return `Response(serializer.data, headers=headers)`

2. Update `source/games/views/characters.py` — `game_pcs` view:
   - Apply `Paginator(request, pcs).paginate()` (same pattern as `game_npcs`)
   - Return `Response(serializer.data, headers=headers)`

3. Add tests to `source/games/tests/views_test.py`:
   - `TestGamesListView`: headers present, `?page=N` and `?per_page=N` respected
   - `TestGamePcsView`: headers present, `?page=N` and `?per_page=N` respected

4. Run full test suite and lint

## Files

| File | Change |
|------|--------|
| `source/games/views/games.py` | Add `Paginator` to `games_list` |
| `source/games/views/characters.py` | Add `Paginator` to `game_pcs` |
| `source/games/tests/views_test.py` | Add pagination tests for games list and PCs |
