# Backend Plan: Add Game Treasures Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces:

- `GET /games/<slug>/treasures.json` — paginated list of treasures for a game
- Item shape: `{ "id": integer, "name": string, "value": integer }`
- Pagination headers: `page`, `pages`, `per_page`, `total`
- Returns 404 when the game slug does not match any game

## Implementation Steps

### Step 1 — Add M2M field to `Game`

Add a `ManyToManyField` from `Game` to `Treasure` (blank=True) inside `source/games/models/game.py`. Name the field `treasures`. This creates the join table in the DB.

### Step 2 — Create migration

Run `docker-compose run --rm majora_be python manage.py makemigrations` to generate migration `0024_game_treasures.py`. Verify it contains a `AddField` with `ManyToManyField`.

### Step 3 — Add `GameTreasureListSerializer`

Create `source/games/serializers/game_treasure_list.py` with a serializer exposing `id`, `name`, and `value` from `Treasure`. This is identical to `TreasureListSerializer` in content but lives in the game serializer namespace for clarity. Register it in `source/games/serializers/__init__.py`.

Alternatively, reuse `TreasureListSerializer` directly — either approach is acceptable; use whichever avoids duplication while keeping imports clean.

### Step 4 — Add view `game_treasures`

Create the view function in `source/games/views/games.py` (or a new `source/games/views/game_treasures.py` file if preferred, consistent with how `characters.py` houses game character views):

```python
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_treasures(request, game_slug):
    """Return a paginated list of treasures for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    page_treasures, headers = Paginator(request, game.treasures.all()).paginate()
    serializer = TreasureListSerializer(page_treasures, many=True)
    return Response(serializer.data, headers=headers)
```

Export it from `source/games/views/__init__.py`.

### Step 5 — Register URL

Add to `source/games/urls.py`:

```python
path('games/<slug:game_slug>/treasures.json', views.game_treasures, name='game-treasures'),
```

Place it alongside the existing `game_pcs` and `game_npcs` URL patterns.

### Step 6 — Write tests

Add `source/games/tests/views/game_treasures_test.py` (or extend `games_test.py`) following the `TestGamePcsView` pattern:

- Returns only treasures linked to the game (not all treasures)
- Returns empty list when game has no treasures
- Returns 404 for unknown game slug
- Pagination headers present (`page`, `pages`, `per_page`)
- Respects `?page=N` and `?per_page=N` params

### Step 7 — Run tests and linter

```bash
docker-compose run --rm majora_be pytest source/games/tests/views/game_treasures_test.py -v
docker-compose run --rm majora_be ruff check source/
```

## Files to Change

- `source/games/models/game.py` — add `treasures = ManyToManyField('Treasure', blank=True)`
- `source/games/migrations/0024_game_treasures.py` — generated migration
- `source/games/serializers/game_treasure_list.py` — new serializer (or reuse `TreasureListSerializer`)
- `source/games/serializers/__init__.py` — export new serializer if added
- `source/games/views/games.py` (or new `source/games/views/game_treasures.py`) — add `game_treasures` view
- `source/games/views/__init__.py` — export `game_treasures`
- `source/games/urls.py` — register URL pattern
- `source/games/tests/views/game_treasures_test.py` — new test file

## CI Checks

- `source/`: `docker-compose run --rm majora_be pytest` (CI job: `backend-test`)
- `source/`: `docker-compose run --rm majora_be ruff check .` (CI job: `backend-lint`)

## Notes

- The M2M field on `Game` is the cleanest approach since `Treasure` already exists as a standalone model. The join table is auto-managed by Django.
- Do NOT add `game` or any back-reference FK to `Treasure` — treasures are shared across games.
- The view follows the same `AllowAny` pattern as `game_pcs` and `game_npcs`: the list is publicly readable, and there is no write operation on this endpoint.
