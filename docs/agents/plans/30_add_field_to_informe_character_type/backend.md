# Backend Plan: Add field to informe character type

Main plan: [plan.md](plan.md)

## Tasks

1. Add `npc = models.BooleanField(default=True)` to `Character` in `models.py`
2. Update `Character.is_pc` property to return `not self.npc`
3. Create migration `0008_character_npc`:
   - Schema step: `AddField` for `npc` with `default=True`
   - Data step: `RunSQL` to execute `UPDATE games_character SET npc = FALSE WHERE player_id IS NOT NULL`
4. Update `game_pcs` view: filter on `npc=False` instead of `player__isnull=False`
5. Update `game_npcs` view: filter on `npc=True` instead of `player__isnull=True`
6. Update tests in `tests/models_test.py` and `tests/views_test.py`:
   - Test `npc` default is `True`
   - Test that `is_pc` returns `True` when `npc=False`
   - Test PC/NPC view filtering via `npc` field

## Files

| File | Change |
|------|--------|
| `source/games/models.py` | Add `npc` field; update `is_pc` property |
| `source/games/migrations/0008_character_npc.py` | Schema + data migration |
| `source/games/views.py` | Update `game_pcs` and `game_npcs` filters |
| `source/games/tests/models_test.py` | Tests for new field and updated property |
| `source/games/tests/views_test.py` | Tests for updated view filters |
