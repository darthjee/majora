# Plan: Add Link Object

Issue: [168-add-link-object.md](../issues/168-add-link-object.md)

## Overview

Refactor the `Link` model to use Django's `ContentType` framework (`GenericForeignKey`), removing the direct `game` FK and replacing it with `content_type` + `object_id` fields. A `GenericRelation` is added to `Game` to preserve the `game.links` reverse accessor used by the existing serializer. The scope is model, migration, and model tests only — no serializer or view changes.

## Context

The existing `Link` model (`source/games/models/link.py`) has a hard-coded `game` ForeignKey. A separate `CharacterLink` model was introduced in issue #135 to fill the gap for character-owned links. This issue makes `Link` polymorphic so a single model can serve both `Game` and `Character` (and any future owner type) using Django's `contenttypes` framework — the same pattern already used by the `Upload` model.

## Implementation Steps

### Step 1 — Update the Link model

In `source/games/models/link.py`:
- Remove `from games.models.game import Game` import and the `game` ForeignKey.
- Add imports for `ContentType` and `GenericForeignKey` from `django.contrib.contenttypes`.
- Add fields:
  - `content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)`
  - `object_id = models.PositiveIntegerField(null=True, blank=True)`
  - `content_object = GenericForeignKey('content_type', 'object_id')`

### Step 2 — Add GenericRelation to Game

In `source/games/models/game.py`:
- Import `GenericRelation` from `django.contrib.contenttypes.fields`.
- Add `links = GenericRelation('games.Link')` to the `Game` model.

This preserves the `game.links` accessor that `GameDetailSerializer` uses via `links = LinkSerializer(many=True, read_only=True)`. Without this, the serializer would break even though the serializer file is not changed.

### Step 3 — Write the migration

Create `source/games/migrations/0022_link_polymorphic.py` — a combined schema + data migration:

1. `AddField`: add `content_type` FK to `contenttypes.ContentType` (nullable).
2. `AddField`: add `object_id` PositiveIntegerField (nullable).
3. `RunPython`: for every existing `Link` row, set `content_type` to the `ContentType` for `Game` and `object_id` to the existing `game_id` value.
4. `RemoveField`: remove the `game` FK.

The migration must declare a dependency on `('contenttypes', '0002_remove_content_type_name')` in addition to `('games', '0021_characterlink')`.

Write a reverse function for `RunPython` that re-creates the `game_id` column data if the migration is reversed (or use `migrations.RunPython.noop` if full reversibility is not required — note that the `RemoveField` step makes full reversal non-trivial; `noop` is acceptable).

### Step 4 — Update model tests

In `source/games/tests/models/test_link.py`:
- Replace `Link.objects.create(..., game=game)` with `Link.objects.create(..., content_object=game)`.
- Replace assertions on `link.game` with assertions on `link.content_object`.
- Add a test that verifies `link.content_type` equals the `ContentType` for `Game`.

## Files to Change

- `source/games/models/link.py` — remove `game` FK; add ContentType fields and GenericForeignKey
- `source/games/models/game.py` — add `GenericRelation('games.Link')` as `links`
- `source/games/migrations/0022_link_polymorphic.py` — new combined schema + data migration
- `source/games/tests/models/test_link.py` — update tests to use the new model structure

## CI Checks

- `source/`: `docker-compose run --rm majora_tests poetry run pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_tests poetry run ruff check --fix .` (CI job: `checks`)

## Notes

- `CharacterLink` is left unchanged by this issue; `Link` is now capable of owning character links as well, but the wiring of `CharacterLink` into `Link` (and the retirement of `CharacterLink`) is a separate future concern.
- The `content_type` and `object_id` fields are kept nullable (matching the `Upload` model pattern) to allow future flexibility. All existing rows will be populated by the data migration.
- The `GenericRelation` on `Game` does not add a database column; it is a Python-only reverse accessor.
