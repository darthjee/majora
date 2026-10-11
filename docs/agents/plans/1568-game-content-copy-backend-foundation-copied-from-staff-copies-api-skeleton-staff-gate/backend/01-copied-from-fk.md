# Add the copied_from FK and migrations
Add a nullable, self-referencing provenance FK to the six copyable models:

```python
copied_from = models.ForeignKey(
    'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='copies',
)
```

on `GameItem`, `GameCommonItem`, `GameRecipe`, `GameDocument`, `GameFaction` and `GamePossession`. Generate the `games` migration and the matching `versioning` migration (all six models use `HistoricalRecords(app='versioning', ...)`) with `makemigrations`, and confirm `makemigrations --check --dry-run` is clean afterwards. No data migration and no backfill. Don't register the field in Django admin, and don't add it to any serializer.

Tests (in the existing model test files for each model, or a new `games/tests/models/copied_from_test.py` parametrized over the six models):
- `copied_from` defaults to null; a row can point to a row of another game.
- Deleting the source sets the copy's `copied_from` to null and the copy survives; the same for deleting the source's game.
- That nulling creates no new historical record on the copy (it's a plain `UPDATE`).
- A regular and a restricted `GameItem` response don't contain `copied_from` (one view test is enough; no serializer uses `__all__`/`exclude`).

## Files to Change
- `backend/games/models/game/game_item.py`, `game_common_item.py`, `game_recipe.py`, `game_document.py`, `game_faction.py`, `game_possession.py` — add `copied_from`.
- `backend/games/migrations/0105_*.py` — new, generated.
- `backend/versioning/migrations/0041_*.py` — new, generated.
- `backend/games/tests/models/...` — `copied_from` tests.
