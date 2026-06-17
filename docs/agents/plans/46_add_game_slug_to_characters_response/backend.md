# Backend Plan: Add game_slug to characters response

Main plan: [plan.md](plan.md)

## Tasks

1. In `source/games/serializers.py`, add `game_slug = serializers.ReadOnlyField(source='game.game_slug')` to both `CharacterListSerializer` and `CharacterDetailSerializer`, and add `'game_slug'` to each `Meta.fields` list.
2. Update `source/games/tests/views_test.py` (PCs/NPCs index tests and the npc/pc detail tests) to assert `game_slug` is present and correct in the response payload.
3. Check `source/games/tests/serializers_test.py` if it exists and update it the same way; otherwise skip.

## Files

| File | Change |
|------|--------|
| `source/games/serializers.py` | Add `game_slug` field to `CharacterListSerializer` and `CharacterDetailSerializer` |
| `source/games/tests/views_test.py` | Assert `game_slug` in responses |
