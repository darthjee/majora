# Backend Plan: Add back button

Main plan: [plan.md](plan.md)

## Shared contracts

- `GET /games/:game_slug/npcs/:character_id.json` → `CharacterDetailSerializer` output, 404 unless `npc=True`.
- `GET /games/:game_slug/pcs/:character_id.json` → `CharacterDetailSerializer` output, 404 unless `npc=False`.
- Remove `GET /games/:game_slug/characters/:character_id.json` and the `character_detail` view/URL.

## Tasks

1. In `source/games/views/characters.py`, replace `character_detail` with two views: `game_npc_detail(request, game_slug, character_id)` and `game_pc_detail(request, game_slug, character_id)`, each using `get_object_or_404(Character, id=character_id, game=game, npc=True/False)`.
2. Update `source/games/views/__init__.py` to export `game_npc_detail` and `game_pc_detail` instead of `character_detail`.
3. Update `source/games/urls.py`: remove the `characters/<int:character_id>.json` path; add `games/<slug:game_slug>/npcs/<int:character_id>.json` (`game-npc-detail`) and `games/<slug:game_slug>/pcs/<int:character_id>.json` (`game-pc-detail`).
4. Update `source/games/tests/views_test.py`: replace `character_detail` tests with equivalent tests for `game_npc_detail` and `game_pc_detail`, including the 404 case when the id belongs to the wrong character type (e.g. requesting an NPC id via the pcs endpoint).

## Files

| File | Change |
|------|--------|
| `source/games/views/characters.py` | Replace `character_detail` with `game_npc_detail` and `game_pc_detail` |
| `source/games/views/__init__.py` | Update exports |
| `source/games/urls.py` | Replace `character-detail` path with `game-npc-detail` and `game-pc-detail` |
| `source/games/tests/views_test.py` | Replace/extend tests for the split endpoints |
