# Backend Plan: Add Character Links

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces:
- A new `CharacterLink` model with fields `id`, `text`, `url`, and a `character` FK (related_name `links`).
- A `CharacterLinkSerializer` exposing `id`, `text`, `url` (no `character` field).
- `CharacterDetailSerializer` gains a nested `links = CharacterLinkSerializer(many=True, read_only=True)` field and adds `'links'` to its `fields` list.
- The existing endpoints `GET /games/<slug>/pcs/<id>.json` and `GET /games/<slug>/npcs/<id>.json` return the character detail, now including the `links` array.

## Implementation Steps

### Step 1 — Create the CharacterLink model

Create `source/games/models/character_link.py`:
```python
from django.db import models
from games.models.character import Character

class CharacterLink(models.Model):
    text = models.CharField(max_length=200)
    url = models.URLField()
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='links')

    def __str__(self):
        return self.text
```

### Step 2 — Register the model in the package __init__.py and admin.py

- Add `from games.models.character_link import CharacterLink` and include `'CharacterLink'` in `__all__` in `source/games/models/__init__.py`.
- Register it in `source/games/admin.py`.

### Step 3 — Create a migration

Generate the migration for the new model. The next migration number is `0021`. Create `source/games/migrations/0021_characterlink.py` following the same structure as `0020_character_hidden.py`, using `migrations.CreateModel`.

### Step 4 — Create CharacterLinkSerializer

Create `source/games/serializers/character_link.py`:
```python
from rest_framework import serializers
from games.models import CharacterLink

class CharacterLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharacterLink
        fields = ['id', 'text', 'url']
```

Register it in `source/games/serializers/__init__.py`.

### Step 5 — Add links to CharacterDetailSerializer

In `source/games/serializers/character_detail.py`:
- Import `CharacterLinkSerializer`.
- Add `links = CharacterLinkSerializer(many=True, read_only=True)` field.
- Add `'links'` to the `fields` list in `Meta`.

### Step 6 — Write tests

- `source/games/tests/models/test_character_link.py`: test model creation, `__str__`, and the FK.
- `source/games/tests/serializers/test_character_link.py`: test `id`, `text`, `url` are serialized; `character` is not exposed.
- In `source/games/tests/serializers/test_character_detail.py`: add tests for empty links list and a list with one link (verify `id`, `text`, `url`).

## Files to Change

- `source/games/models/character_link.py` — new file: CharacterLink model
- `source/games/models/__init__.py` — add import and __all__ entry
- `source/games/admin.py` — register CharacterLink
- `source/games/migrations/0021_characterlink.py` — new migration
- `source/games/serializers/character_link.py` — new file: CharacterLinkSerializer
- `source/games/serializers/__init__.py` — add import and __all__ entry
- `source/games/serializers/character_detail.py` — add nested links field
- `source/games/tests/models/test_character_link.py` — new test file
- `source/games/tests/serializers/test_character_link.py` — new test file
- `source/games/tests/serializers/test_character_detail.py` — add link tests

## CI Checks

- `source/`: `docker-compose run --rm majora_django poetry run pytest` (CI job: `pytest`)

## Notes

- Follow the same pattern used by `Link` (FK to `Game`) and `Photo` (FK to `Character`) — the `CharacterLink` is structurally analogous to both.
- The migration must be hand-crafted (no `manage.py makemigrations` available from the coordinator) — follow the format of `0020_character_hidden.py` and use `migrations.CreateModel`.
- No new endpoint or URL change is needed.
