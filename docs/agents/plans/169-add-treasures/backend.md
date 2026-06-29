# Backend Plan: Add Treasures

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces the REST API that the frontend consumes. All five endpoints listed in the shared contracts must be live and return the documented shapes before the frontend can be tested end-to-end.

The model, serializers, and views already exist as individual files. The missing pieces are:
- `TreasureEditPermission` in `permissions.py`
- `Treasure` export in `models/__init__.py`
- Five treasure serializers exported from `serializers/__init__.py`
- Three treasure views imported in `views/__init__.py`
- Three URL patterns in `urls.py`
- `Treasure` registered in `admin.py`

## Implementation Steps

### Step 1 — Add `TreasureEditPermission` to `permissions.py`

Add a `TreasureEditPermission` class to `source/games/permissions.py`, following the same pattern as `GameEditPermission` and `CharacterEditPermission`. The `check` classmethod must:
1. Return a 401 Response if the user is not authenticated.
2. Call `treasure.can_be_edited_by(request.user)` and return a 403 Response if it returns `False`.
3. Return `None` if the user is authorized.

### Step 2 — Export `Treasure` from `models/__init__.py`

Add `from games.models.treasure import Treasure` to `source/games/models/__init__.py` and include `'Treasure'` in `__all__`. This unblocks all serializers that already do `from games.models import Treasure`.

### Step 3 — Export treasure serializers from `serializers/__init__.py`

Add imports and `__all__` entries for the five treasure serializers:
- `TreasureAccessSerializer`
- `TreasureCreateSerializer`
- `TreasureDetailSerializer`
- `TreasureListSerializer`
- `TreasureUpdateSerializer`

### Step 4 — Import treasure views into `views/__init__.py`

Add `from .treasures import treasure_access, treasure_detail, treasures_list` to `source/games/views/__init__.py` and include all three in `__all__`.

### Step 5 — Add treasure URL patterns to `urls.py`

Append three URL patterns to `source/games/urls.py`:
- `path('treasures.json', views.treasures_list, name='treasures-list')`
- `path('treasures/<int:treasure_id>.json', views.treasure_detail, name='treasure-detail')`
- `path('treasures/<int:treasure_id>/access.json', views.treasure_access, name='treasure-access')`

### Step 6 — Register `Treasure` in `admin.py`

Add `from .models import Treasure` import (alongside the existing model imports) and `admin.site.register(Treasure)` to `source/games/admin.py`.

### Step 7 — Run checks and verify

Run:
```
docker-compose run --rm majora_django poetry run pytest source/games/tests/views/treasures_test.py source/games/tests/models/test_treasure.py source/games/tests/serializers/test_treasure_access.py source/games/tests/serializers/test_treasure_detail.py source/games/tests/serializers/test_treasure_list.py -v
```

Then run the full test suite and linter:
```
docker-compose run --rm majora_django poetry run pytest
docker-compose run --rm majora_django poetry run ruff check .
```

## Files to Change

- `source/games/permissions.py` — add `TreasureEditPermission`
- `source/games/models/__init__.py` — export `Treasure`
- `source/games/serializers/__init__.py` — export five treasure serializers
- `source/games/views/__init__.py` — import and export three treasure views
- `source/games/urls.py` — add three treasure URL patterns
- `source/games/admin.py` — register `Treasure`

## CI Checks

- `source/`: `docker-compose run --rm majora_django poetry run pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_django poetry run ruff check .` (CI job: `checks`)

## Notes

- The `Treasure.can_be_edited_by(user)` method already exists on the model and checks `user.is_authenticated and user.is_superuser`.
- The migration `0023_treasure.py` already exists; no new migration is needed.
- The tests in `treasures_test.py` already reference URL names `treasures-list`, `treasure-detail`, and `treasure-access` — they will pass once `urls.py` is updated.
- There are no existing tests for `TreasureEditPermission` itself; the view tests exercise the permission indirectly through PATCH and POST checks.
