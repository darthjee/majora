# Backend Plan: Make character class nullable

Main plan: [plan.md](plan.md)

## Tasks

1. In `source/games/models.py`, update `character_class` to add `null=True`:
   ```python
   character_class = models.CharField(max_length=200, blank=True, null=True)
   ```
2. Generate the migration: `python manage.py makemigrations games`
3. Verify the serializer (`CharacterDetailSerializer` and `CharacterListSerializer`) — no changes needed since DRF returns `null` for `None` values automatically
4. Add tests covering:
   - Creating a `Character` with `character_class=None` succeeds
   - The detail endpoint returns `null` for `character_class` when not set
5. Run full test suite and lint

## Files

| File | Change |
|------|--------|
| `source/games/models.py` | Add `null=True` to `character_class` |
| `source/games/migrations/00XX_...py` | New migration |
| `source/games/tests/models_test.py` | Add test for null character_class |
| `source/games/tests/views_test.py` | Add test for null character_class in API response |
