# Backend Plan: Add NPC enemy/foe field with filters

Main plan: [plan.md](plan.md)

## Shared contracts

- Public list/detail endpoints (`pcs.json`, `npcs.json`, `pcs/<id>.json`, `npcs/<id>.json`)
  return a single `allegiance` key sourced from `public_allegiance`.
- DM/admin endpoints (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`) return both
  `allegiance` (real field) and `public_allegiance` (public-facing field) as separate keys.
- `?allegiance=` (`ally`/`enemy`/`neutral`) filters `npcs.json` on `public_allegiance` and
  `npcs/all.json` on `allegiance`; unrecognized/absent values are ignored (same tolerant pattern
  as the existing `?slain=` filter).
- Only `CharacterEditPermission` (GameMaster of the character's game, or superuser — already
  DM-only in practice for NPCs since they have no player owner) may write `allegiance`/
  `public_allegiance`, via the existing `PATCH /games/<slug>/npcs/<id>.json` endpoint.

## Implementation Steps

### Step 1 — Model fields

In `source/games/models/character.py`, add plain-constants-plus-choices fields following the
`Upload.STATUS_*` convention (see `source/games/models/upload.py`):

```python
ALLEGIANCE_ALLY = 'ally'
ALLEGIANCE_ENEMY = 'enemy'
ALLEGIANCE_NEUTRAL = 'neutral'

ALLEGIANCE_CHOICES = [
    (ALLEGIANCE_ALLY, 'Ally'),
    (ALLEGIANCE_ENEMY, 'Enemy'),
    (ALLEGIANCE_NEUTRAL, 'Neutral'),
]

allegiance = models.CharField(max_length=16, choices=ALLEGIANCE_CHOICES, default=ALLEGIANCE_NEUTRAL)
public_allegiance = models.CharField(
    max_length=16, choices=ALLEGIANCE_CHOICES, default=ALLEGIANCE_NEUTRAL
)
```

Generate the migration (`docker-compose run --rm majora_tests python manage.py makemigrations`,
or the project's documented equivalent).

### Step 2 — Update serializer (write path)

In `source/games/serializers/character_update.py`, add `'allegiance'` and `'public_allegiance'`
to `CharacterUpdateSerializer.Meta.fields` (both already covered by the existing
`extra_kwargs = {field: {'required': False} for field in fields}` comprehension, so no further
change needed there). This is the only write path — reached via
`PATCH /games/<slug>/npcs/<id>.json`, gated by `CharacterEditPermission` exactly like the
existing `hidden` field.

Do **not** add these fields to `CharacterCreateSerializer` — the issue only asks for editing via
PATCH; both fields default to `neutral` on creation via the model default.

### Step 3 — Public read path (List + Detail)

In `source/games/serializers/character_list.py` (`CharacterListSerializer`, shared by
`pcs.json`/`npcs.json`) and `source/games/serializers/character_detail.py`
(`CharacterDetailSerializer`, shared by `pcs/<id>.json`/`npcs/<id>.json`), add:

```python
allegiance = serializers.CharField(source='public_allegiance', read_only=True)
```

and add `'allegiance'` to each `Meta.fields` list.

### Step 4 — DM/admin read path (FullList + Full)

Add a new `CharacterFullListSerializer` in `source/games/serializers/character_full_list.py`
(new file, following the one-class-per-file convention), analogous to how
`CharacterFullSerializer` extends `CharacterDetailSerializer`:

```python
"""Character full list serializer for the games app (DM/admin NPC list)."""

from rest_framework import serializers

from games.serializers.character_list import CharacterListSerializer


class CharacterFullListSerializer(CharacterListSerializer):
    """Serializer for the DM/admin NPC list, exposing both allegiance fields."""

    allegiance = serializers.CharField(read_only=True)
    public_allegiance = serializers.CharField(read_only=True)

    class Meta(CharacterListSerializer.Meta):
        """Metadata for the CharacterFullListSerializer."""

        fields = CharacterListSerializer.Meta.fields + ['public_allegiance']
```

Note `allegiance` is redeclared here (no `source=`) so it reads the real `allegiance` field
instead of the inherited `source='public_allegiance'` override.

Apply the same override pattern to `CharacterFullSerializer`
(`source/games/serializers/character_full.py`):

```python
"""Character full serializer for the games app."""

from rest_framework import serializers

from games.serializers.character_detail import CharacterDetailSerializer


class CharacterFullSerializer(CharacterDetailSerializer):
    """Serializer for full character detail including the private description."""

    allegiance = serializers.CharField(read_only=True)
    public_allegiance = serializers.CharField(read_only=True)

    class Meta(CharacterDetailSerializer.Meta):
        """Metadata for the CharacterFullSerializer."""

        fields = CharacterDetailSerializer.Meta.fields + ['private_description', 'public_allegiance']
```

Register `CharacterFullListSerializer` in `source/games/serializers/__init__.py` (follow the
existing export pattern for the other serializers).

Update `source/games/views/characters/game_npcs_all.py` to import and use
`CharacterFullListSerializer` instead of `CharacterListSerializer`.

### Step 5 — Query-param filtering

In `source/games/views/characters/_shared.py`, extend `_filter_characters` with an
`allegiance_field` parameter (default `'public_allegiance'`, matching the public-endpoint
default):

```python
def _filter_characters(request, queryset, allegiance_field='public_allegiance'):
    """Narrow `queryset` by the optional `slain`/`name`/`allegiance` query params, if present."""
    slain = request.query_params.get('slain')
    if slain is not None and slain.lower() in ('true', 'false'):
        queryset = queryset.filter(slain=(slain.lower() == 'true'))

    name = request.query_params.get('name')
    if name:
        queryset = queryset.filter(name__icontains=name)

    allegiance = request.query_params.get('allegiance')
    if allegiance in (Character.ALLEGIANCE_ALLY, Character.ALLEGIANCE_ENEMY, Character.ALLEGIANCE_NEUTRAL):
        queryset = queryset.filter(**{allegiance_field: allegiance})

    return queryset
```

In `source/games/views/characters/game_npcs_all.py`, call
`_filter_characters(request, npcs, allegiance_field='allegiance')` (the call in
`source/games/views/characters/game_npcs.py` stays as `_filter_characters(request, npcs)`, using
the new default).

## Files to Change

- `source/games/models/character.py` — add `allegiance`/`public_allegiance` fields + choices.
- `source/games/migrations/` — new migration for the two fields.
- `source/games/serializers/character_update.py` — add both fields to the write serializer.
- `source/games/serializers/character_list.py` — add `allegiance` (sourced from
  `public_allegiance`).
- `source/games/serializers/character_detail.py` — add `allegiance` (sourced from
  `public_allegiance`).
- `source/games/serializers/character_full.py` — override `allegiance` to the real field, add
  `public_allegiance`.
- `source/games/serializers/character_full_list.py` — new file, `CharacterFullListSerializer`.
- `source/games/serializers/__init__.py` — export `CharacterFullListSerializer`.
- `source/games/views/characters/game_npcs_all.py` — use `CharacterFullListSerializer`, pass
  `allegiance_field='allegiance'` to `_filter_characters`.
- `source/games/views/characters/_shared.py` — extend `_filter_characters` with the
  `allegiance_field` param and `allegiance` query-param handling.

## Tests to add/update

- `source/games/tests/models/test_character.py` — default values for the two new fields.
- `source/games/tests/serializers/test_character_list.py` — `allegiance` sourced from
  `public_allegiance`.
- `source/games/tests/serializers/test_character_detail.py` — same, for the detail serializer.
- `source/games/tests/serializers/test_character_full.py` — `allegiance` sourced from the real
  field, `public_allegiance` present.
- New `source/games/tests/serializers/test_character_full_list.py` for
  `CharacterFullListSerializer`.
- `source/games/tests/serializers/test_character_update.py` — both fields accepted/persisted.
- `source/games/tests/views/characters/game_characters_test.py` and
  `source/games/tests/views/characters/game_npcs_all_test.py` — `?allegiance=` filtering on each
  list endpoint (correct field targeted per endpoint), plus permission tests confirming a
  non-editor PATCH attempt to set `allegiance`/`public_allegiance` is rejected (403) consistent
  with existing `hidden` coverage.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: backend tests)

## Notes

- `CharacterCreateSerializer` is intentionally left untouched — see Step 2.
- The shared-serializer approach means `pcs.json`/`pcs/<id>.json` also gain an `allegiance` key
  (always `"neutral"` in practice, since no PC write path ever sets it) and
  `pcs/<id>/full.json` also gains `public_allegiance`. This is accepted scope (see `plan.md`'s
  "Shared contracts" and "Notes" — confirmed with the `product-owner` agent), mirroring the
  existing `slain` field precedent (shared model/serializer, NPC-only write path, harmless
  read-only exposure on PCs).
