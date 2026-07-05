# Backend Plan: Add character treasures

Main plan: [plan.md](plan.md)

## Shared contracts

- Must implement the two endpoints and exact item shape described in
  [plan.md](plan.md#new-api-endpoints-produced-by-backend-consumed-by-frontend).
- No other agent depends on backend internals beyond the endpoint contract above.

## Implementation Steps

### Step 1 — Add the `CharacterTreasure` model

Add `source/games/models/character_treasure.py`:

```python
class CharacterTreasure(models.Model):
    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_treasures',
    )
    treasure = models.ForeignKey(
        'games.Treasure', on_delete=models.CASCADE, related_name='character_treasures',
    )
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['id']
```

- Register it in `source/games/models/__init__.py` (import + `__all__`), following the
  existing alphabetical ordering used there.
- Generate the migration (next number after `0033_treasure_game_alter_game_treasures.py`,
  i.e. `0034_charactertreasure.py` or whatever `makemigrations` names it).
- Register `CharacterTreasure` in `source/games/admin.py` via a plain
  `admin.site.register(CharacterTreasure)` (same pattern as every other model there) —
  this is the only way to manage assignments for now, per the issue's explicit scope.

### Step 2 — Add the list serializer

Add `source/games/serializers/character_treasure.py`:

```python
class CharacterTreasureSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='treasure.name', read_only=True)
    value = serializers.IntegerField(source='treasure.value', read_only=True)

    class Meta:
        model = CharacterTreasure
        fields = ['id', 'name', 'quantity', 'value']
```

Register it in `source/games/serializers/__init__.py` (import + `__all__`), matching the
existing alphabetical convention.

### Step 3 — Add the two views

Add `source/games/views/characters/game_pc_treasures.py` and
`source/games/views/characters/game_npc_treasures.py`, mirroring
`source/games/views/characters/game_pc_photos.py` and `game_npc_photos.py` exactly (same
`get_object_or_404` lookups, same `AllowAny` + `CookieTokenAuthentication` setup, same
hidden-gate `if character.hidden and not character.can_be_edited_by(request.user): raise
Http404` for the NPC view only). Query via
`character.character_treasures.select_related('treasure').all()` and return with
`paginated_list_response(request, treasures, CharacterTreasureSerializer)`.

Register both new views in two places, exactly like `game_pc_photos`/`game_npc_photos`
already are:
- `source/games/views/characters/__init__.py` — add the two imports (alphabetically) and
  add both names to `__all__`.
- `source/games/views/__init__.py` — this module re-exports from
  `games.views.characters` too (see how `game_pc_photos`/`game_npc_photos` are imported
  and added to `__all__` there); add the two new names the same way.

### Step 4 — Wire up the URLs

In `source/games/urls.py`, add, right next to the existing `.../photos.json` pairs:

```python
path(
    'games/<slug:game_slug>/pcs/<int:character_id>/treasures.json',
    views.game_pc_treasures,
    name='game-pc-treasures',
),
path(
    'games/<slug:game_slug>/npcs/<int:character_id>/treasures.json',
    views.game_npc_treasures,
    name='game-npc-treasures',
),
```

### Step 5 — Tests

Add backend tests mirroring the existing coverage style for
`game_pc_photos` / `game_npc_photos` (likely under `source/games/tests/views/characters/`
or wherever those live) — cover: empty list, populated list with correct `name`/`quantity`/
`value`, pagination, 404 for wrong game/segment, and the NPC hidden-gate (visible to
editors, 404 to everyone else). Also add a small model test for `CharacterTreasure`
(default `quantity=0`, string/ordering as applicable) if the existing model test suite
has a similar precedent for `Treasure`/`Game` M2M — mirror whatever exists there.

## Files to Change

- `source/games/models/character_treasure.py` — new `CharacterTreasure` model
- `source/games/models/__init__.py` — register the new model
- `source/games/migrations/00XX_charactertreasure.py` — new migration
- `source/games/admin.py` — register `CharacterTreasure`
- `source/games/serializers/character_treasure.py` — new `CharacterTreasureSerializer`
- `source/games/serializers/__init__.py` — register the new serializer
- `source/games/views/characters/game_pc_treasures.py` — new view
- `source/games/views/characters/game_npc_treasures.py` — new view
- `source/games/views/characters/__init__.py` (and any higher-level `views/__init__.py`
  re-export) — wire up the new views
- `source/games/urls.py` — two new URL patterns
- `source/games/tests/...` — new tests for models/views as described above

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views`,
  `pytest_all`)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- Do not add create/update/delete endpoints or serializers for `CharacterTreasure` —
  explicitly out of scope per the issue; Django admin is the management path for now.
- Reuse `character.can_be_edited_by` as-is; do not add new permission classes.
