# Plan: Add DM Role

Issue: [112-add-dm-role.md](../issues/112-add-dm-role.md)

## Overview

Introduce a `GameMaster` model that links a `Game` to a `User`, analogous to how `Player` links a `PC` to a `User`. A game may have multiple DMs simultaneously, so this requires a new joining table rather than a FK on `Game`. The work is entirely in the backend (`source/games/`): model, migration, serializer, views, URL routes, and tests.

## Context

The existing `Player` model connects `User` → `PC` (via `player.user` FK + `player.games` M2M). There is no parallel construct for DMs. The issue asks for a new `GameMaster` model with `game` FK and `user` FK, API endpoints to create/list/delete DM assignments, and appropriate authentication guards.

## Implementation Steps

### Step 1 — Add the `GameMaster` model

In `source/games/models.py`, add:

```python
class GameMaster(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='game_masters')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_master_roles')

    class Meta:
        unique_together = [('game', 'user')]
        ordering = ['id']

    def __str__(self):
        return f'GameMaster(game={self.game.name}, user={self.user.username})'
```

`unique_together` prevents the same user from being added as DM of the same game twice.

### Step 2 — Generate and write the migration

Run inside the tests container:

```bash
docker-compose run --rm majora_tests python manage.py makemigrations games
```

Verify the generated file under `source/games/migrations/` looks correct (creates `games_gamemaster` table with FK columns and a unique constraint).

### Step 3 — Add the serializer

In `source/games/serializers.py`, add a `GameMasterSerializer`:

```python
class GameMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameMaster
        fields = ['id', 'user']
```

The `game` is always inferred from the URL, so it is not exposed as a writable field.

### Step 4 — Add views

Create or extend a view file (e.g. `source/games/views/game_masters.py`) with:

- `game_masters_list(request, game_slug)` — `GET` returns all DM assignments for a game; `POST` adds a new one (authentication required).
- `game_master_detail(request, game_slug, game_master_id)` — `DELETE` removes a DM assignment (authentication + superuser or self only).

Use `TokenAuthentication` + `AllowAny` permission class, then check `request.user.is_authenticated` (and optionally `is_superuser`) manually inside the view body, consistent with the existing pattern in `characters.py`.

### Step 5 — Register URL routes

In `source/games/urls.py`, add:

```python
path('games/<slug:game_slug>/game-masters.json', views.game_masters_list, name='game-masters-list'),
path('games/<slug:game_slug>/game-masters/<int:game_master_id>.json', views.game_master_detail, name='game-master-detail'),
```

### Step 6 — Update `__init__.py` / views `__init__.py`

Export the new view functions from `source/games/views/__init__.py` so that `urls.py` can import them via `from . import views`.

### Step 7 — Register in Django Admin

In `source/games/admin.py`, register `GameMaster` so it is visible in the admin panel.

### Step 8 — Write tests

Add tests in `source/games/tests/`:

- `models_test.py` — `TestGameMaster`: creation, unique constraint, `__str__`, cascade delete when game or user is deleted.
- `views_test.py` — `TestGameMastersListView` and `TestGameMasterDetailView`: GET list, POST create (auth required), DELETE (auth + permission checks), 404 for unknown game/id.

## Files to Change

- `source/games/models.py` — add `GameMaster` model
- `source/games/migrations/0014_gamemaster.py` — new migration (generated)
- `source/games/serializers.py` — add `GameMasterSerializer`
- `source/games/views/game_masters.py` — new file with `game_masters_list` and `game_master_detail`
- `source/games/views/__init__.py` — export new view functions
- `source/games/urls.py` — register new routes
- `source/games/admin.py` — register `GameMaster`
- `source/games/tests/models_test.py` — add `TestGameMaster`
- `source/games/tests/views_test.py` — add view tests for new endpoints

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_tests ruff check source/` (CI job: `checks`)

## Notes

- The `unique_together` constraint means calling POST twice with the same user/game is idempotent at the DB level — the view should return 400 with a meaningful error in that case.
- No frontend changes are needed; the issue is backend-only.
- The migration number will be `0014` if `0013_player_user.py` is the current head — verify before committing.
