# Backend Plan: Split slain into public and private slain

Main plan: [plan.md](plan.md)

## Shared contracts

- `PATCH /games/:game_slug/npcs/:id/slain.json` keeps its current `CharacterEditPermission`
  gate; request body accepts `slain` and/or `public_slain` (at least one required), response
  returns both current values.
- Public-facing serializers alias `slain` → `public_slain` model field; DM-facing serializers
  expose both real fields under their own keys.
- Public NPC list filters `?slain=` against `public_slain`; DM NPC list filters against real
  `slain`.
- `public_slain` stays out of `CharacterUpdateSerializer`/`CharacterCreateSerializer`, matching
  `slain`'s existing precedent (dedicated endpoint only).

## Implementation Steps

### Step 1 — Model field

In `source/games/models/character.py`, add:

```python
public_slain = models.BooleanField(default=False)
```

right after the existing `slain = models.BooleanField(default=False)` line.

### Step 2 — Migration with backfill

Create `source/games/migrations/0041_character_public_slain.py` (next number after
`0040_task.py`) with two operations:

1. `AddField` for `public_slain` (`BooleanField(default=False)`), same shape as
   `0032_character_slain.py`.
2. A `migrations.RunPython` data migration that sets `public_slain = slain` for every existing
   row (e.g. `Character.objects.update(public_slain=F('slain'))` using the historical model via
   `apps.get_model('games', 'Character')`), with a no-op reverse function. This matches the
   issue's requirement that the new column starts with the same value as the old one for
   existing NPCs, rather than relying on the `False` field default (which would silently revive
   every already-slain NPC in the public view).

### Step 3 — Slain-toggle serializer and view

`source/games/serializers/character_slain_update.py` (`CharacterSlainUpdateSerializer`):
make both `slain` and `public_slain` optional `BooleanField`s, and add a `validate()` override
that raises a validation error if neither key is present in the payload.

`source/games/views/characters/_slain_set.py` (`character_slain_set`): after validation, set
`character.slain`/`character.public_slain` only for the keys actually present in
`serializer.validated_data` (leave the other field untouched), save, and return
`Response({'slain': character.slain, 'public_slain': character.public_slain}, status=200)`.

No changes needed to `game_npc_slain_set.py` — permission/method wiring stays the same.

### Step 4 — Public-facing serializers (alias to `public_slain`)

In `source/games/serializers/character_list.py` and `character_detail.py`, change:

```python
slain = serializers.BooleanField(read_only=True)
```

to:

```python
slain = serializers.BooleanField(source='public_slain', read_only=True)
```

matching the existing `allegiance = serializers.CharField(source='public_allegiance', ...)` line
right below it.

### Step 5 — DM-facing serializers (expose both real fields)

In `source/games/serializers/character_full_list.py` and `character_full.py`, add (mirroring
the existing `allegiance`/`public_allegiance` overrides in the same classes):

```python
slain = serializers.BooleanField(read_only=True)
public_slain = serializers.BooleanField(read_only=True)
```

and add `'public_slain'` to each `Meta.fields` extension (alongside the existing
`'public_allegiance'` entry).

### Step 6 — Filters

In `source/games/views/characters/_shared.py`, generalize `_filter_characters` to accept a
`slain_field='public_slain'` parameter (same pattern as the existing `allegiance_field`
parameter), and filter with `queryset.filter(**{slain_field: (slain.lower() == 'true')})`
instead of the current hardcoded `slain=`.

In `source/games/views/characters/game_npcs_all.py`, pass `slain_field='slain'` alongside the
existing `allegiance_field='allegiance'` when calling `_filter_characters`.
`source/games/views/characters/game_npcs.py` needs no change (keeps the new default).

### Step 7 — Tests

- `source/games/tests/views/characters/game_npc_slain_set_test.py`: cover updating `slain` only,
  `public_slain` only, both together, neither (400), and confirm the response body shape.
- Serializer tests for `character_list`/`character_detail` (alias exposes `public_slain` as
  `slain`) and `character_full_list`/`character_full` (both real fields exposed).
- Filter tests for `game_npcs` (filters on `public_slain`) and `game_npcs_all` (filters on real
  `slain`).
- A migration/model test (or extend an existing one) asserting the backfill sets `public_slain`
  equal to each row's pre-existing `slain` value.

### Step 8 — Access-control documentation

Update `docs/agents/access-control.md`:
- The "Character slain-toggle endpoint" section: request body now accepts `slain` and/or
  `public_slain`, response returns both.
- The "Detail"/list field tables: `slain` is now described as an alias for `public_slain` on
  public endpoints (same treatment as the existing "Allegiance fields" subsection), and
  `npcs/all.json`/full endpoints additionally return `public_slain`.
- The `?slain=` filter description: note it filters `public_slain` on `npcs.json` and real
  `slain` on `npcs/all.json`, same as the existing `?allegiance=` filter description.

## Files to Change

- `source/games/models/character.py` — add `public_slain` field.
- `source/games/migrations/0041_character_public_slain.py` — new migration, add field + backfill.
- `source/games/serializers/character_slain_update.py` — accept optional `slain`/`public_slain`.
- `source/games/views/characters/_slain_set.py` — write only the fields present, return both.
- `source/games/serializers/character_list.py` — alias `slain` to `public_slain`.
- `source/games/serializers/character_detail.py` — alias `slain` to `public_slain`.
- `source/games/serializers/character_full_list.py` — expose both real fields.
- `source/games/serializers/character_full.py` — expose both real fields.
- `source/games/views/characters/_shared.py` — generalize slain filter field.
- `source/games/views/characters/game_npcs_all.py` — filter on real `slain`.
- `source/games/tests/views/characters/game_npc_slain_set_test.py` — updated/new coverage.
- Serializer/filter test files under `source/games/tests/serializers/` and
  `source/games/tests/views/characters/` — updated/new coverage.
- `docs/agents/access-control.md` — document the split, per this repo's convention of updating
  it alongside any endpoint/serializer change.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest games/tests/views/characters/ --cov` (CI job: `pytest_views_characters`)
- `source/`: `docker-compose run --rm majora_tests pytest --cov` for the full suite (CI job: `pytest_all`, covers serializer/model/migration tests outside `views/`)
- `source/`: `docker-compose run --rm majora_be poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirm the exact bulk-update approach in the data migration works against the historical
  model (`apps.get_model`) — `F()` expressions are fine there, but double-check the migration
  runs cleanly against the test DB used by `bin/configure_database.sh all`.
- No PC-facing behavior changes: PCs share the `Character` model/serializers but have no write
  path to either `slain` field, matching today's precedent.
