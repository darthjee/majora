# Backend Plan: Add photos to game

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces the `photos` field in `GET /games/<slug>.json`:

```json
"photos": [
  { "id": 1, "url": "https://example.com/img1.jpg" }
]
```

- Field name on the serializer: `photos` (matches `related_name='photos'` on `GamePhoto.game`).
- `photos` is always present; empty array when no photos exist.
- Each item: `id` (integer, read-only) and `url` (string, URLField).

## Implementation Steps

### Step 1 — Add the `GamePhoto` model

Create `source/games/models/game_photo.py`:

```python
from django.db import models
from games.models.game import Game

class GamePhoto(models.Model):
    url = models.URLField()
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='photos')

    def __str__(self):
        return self.url
```

Export it from `source/games/models/__init__.py` (add to import list and `__all__`).

### Step 2 — Create the migration

Generate via Django's makemigrations (or write manually):
`source/games/migrations/0016_create_game_photo.py`

The migration creates the `games_gamephoto` table with `id`, `url`, and `game_id` columns.

### Step 3 — Add `GamePhotoSerializer`

Create `source/games/serializers/game_photo.py`:

```python
from rest_framework import serializers
from games.models import GamePhoto

class GamePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePhoto
        fields = ['id', 'url']
```

Export it from `source/games/serializers/__init__.py`.

### Step 4 — Update `GameDetailSerializer`

In `source/games/serializers/game_detail.py`, add the `photos` nested serializer:

```python
from games.serializers.game_photo import GamePhotoSerializer

class GameDetailSerializer(serializers.ModelSerializer):
    links = LinkSerializer(many=True, read_only=True)
    photos = GamePhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo', 'description', 'links', 'photos']
```

### Step 5 — Register in admin

In `source/games/admin.py`, import `GamePhoto` and register it:
```python
from .models import Character, Game, GameMaster, GamePhoto, Link, Photo, Player
admin.site.register(GamePhoto)
```

### Step 6 — Write tests

**`source/games/tests/models/test_game_photo.py`** — test model creation and `__str__`.

**`source/games/tests/serializers/test_game_photo.py`** — test that `id` and `url` are serialized.

**`source/games/tests/serializers/test_game_detail.py`** — add tests:
- `photos` is an empty list when the game has no photos.
- `photos` contains the expected items (with `id` and `url`) when photos exist.

## Files to Change

- `source/games/models/game_photo.py` — new model
- `source/games/models/__init__.py` — export `GamePhoto`
- `source/games/migrations/0016_create_game_photo.py` — new migration
- `source/games/serializers/game_photo.py` — new serializer
- `source/games/serializers/__init__.py` — export `GamePhotoSerializer`
- `source/games/serializers/game_detail.py` — add `photos` field
- `source/games/admin.py` — register `GamePhoto`
- `source/games/tests/models/test_game_photo.py` — new model tests
- `source/games/tests/serializers/test_game_photo.py` — new serializer tests
- `source/games/tests/serializers/test_game_detail.py` — add photos tests

## CI Checks

- `source/`: `docker-compose run --rm majora_django poetry run pytest` (CI job: `pytest`)

## Notes

- Do not modify the existing `Photo` model (which is character-specific). The new `GamePhoto` is a separate model.
- The migration number should follow the latest existing migration (`0015_character_descriptions.py` → `0016_create_game_photo.py`).
- Run `docker-compose run --rm majora_django poetry run python manage.py makemigrations` to generate the migration, or write it manually following the pattern of `0004_create_photo.py`.
