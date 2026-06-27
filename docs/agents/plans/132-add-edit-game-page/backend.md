# Backend Plan: Add Edit Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces:
- `PATCH /games/<game_slug>.json` — accepts `{name?, photo?, description?}`, returns updated `GameDetailSerializer` output (200), or 401/403/400.
- `GET /games/<game_slug>/access.json` — always 200 `{can_edit: bool}`, header `X-Skip-Cache: true`. For non-existent slugs or unauthenticated users: `{can_edit: false}`.

Character access endpoints (`game_pc_access`, `game_npc_access`) must also be fixed to always return 200 (currently 404 for non-existent objects).

## Implementation Steps

### Step 1 — Add `can_be_edited_by` to the `Game` model

In `source/games/models/game.py`:
- Import `User` from `django.contrib.auth.models`.
- Add `can_be_edited_by(self, user)` method:
  - Returns `False` if user is `None` or not authenticated.
  - Returns `True` if `user.is_superuser`.
  - Returns `True` if `self.game_masters.filter(user=user).exists()`.
  - Otherwise returns `False`.
- Add a test in `source/games/tests/models/test_game.py` covering: superuser→True, DM→True, non-DM user→False, unauthenticated (None or anonymous)→False.

### Step 2 — Add `GameEditPermission`

In `source/games/permissions.py`:
- Add `GameEditPermission` class, analogous to `CharacterEditPermission`.
- `check(cls, request, game)` → returns a 401 Response if not authenticated, a 403 Response if `not game.can_be_edited_by(request.user)`, else `None`.
- Add tests in `source/games/tests/permissions_test.py`.

### Step 3 — Add `GameUpdateSerializer`

Create `source/games/serializers/game_update.py`:
```python
class GameUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['name', 'photo', 'description']
        extra_kwargs = {field: {'required': False} for field in fields}
```
Export from `source/games/serializers/__init__.py`.
Add tests in `source/games/tests/serializers/test_game_update.py`.

### Step 4 — Upgrade `game_detail` view to handle PATCH

In `source/games/views/games.py`:
- Change `@api_view(['GET'])` to `@api_view(['GET', 'PATCH'])`.
- Add `@authentication_classes([TokenAuthentication])` and `@permission_classes([AllowAny])` decorators.
- On PATCH: call `GameEditPermission.check(request, game)`; if non-None, return that response. Then validate with `GameUpdateSerializer(game, data=request.data, partial=True)`, save, and return `GameDetailSerializer(game).data`.
- Add tests in `source/games/tests/views/games_test.py` covering: unauthenticated→401, non-DM→403, DM→200 with updated data, invalid payload→400.

### Step 5 — Add `game_access` view

In `source/games/views/games.py`:
- Add `game_access(request, game_slug)` view:
  - Decorated with `@api_view(['GET'])`, `@authentication_classes([TokenAuthentication])`, `@permission_classes([AllowAny])`.
  - Use `Game.objects.filter(game_slug=game_slug).first()` (never `get_object_or_404`).
  - If game is `None` or user cannot edit: `can_edit = False`.
  - Else: `can_edit = game.can_be_edited_by(request.user)`.
  - Return `Response({'can_edit': can_edit})` with `X-Skip-Cache: true` header.
- Add tests covering: non-existent slug→200 `{can_edit: false}`, unauthenticated→200 `{can_edit: false}`, DM→200 `{can_edit: true}`, non-DM→200 `{can_edit: false}`.

### Step 6 — Fix character access endpoints to always return 200

In `source/games/views/characters.py`, update `game_pc_access` and `game_npc_access`:
- Replace `get_object_or_404(Game, ...)` with `Game.objects.filter(...).first()`.
- Replace `get_object_or_404(Character, ...)` with `Character.objects.filter(...).first()`.
- If game or character is `None`, return `Response({'can_edit': False})` with `X-Skip-Cache: true`.
- Update existing tests in `source/games/tests/views/characters_test.py` to cover the 200-for-non-existent case.

### Step 7 — Register new URL

In `source/games/urls.py`, add:
```python
path('games/<slug:game_slug>/access.json', views.game_access, name='game-access'),
```
Place it before the `game-detail` entry to avoid slug ambiguity is not an issue here (different path), but order after `game-masters` patterns for clarity.

### Step 8 — Export from `views/__init__.py`

Ensure `game_access` is exported from `source/games/views/__init__.py`.

## Files to Change

- `source/games/models/game.py` — add `can_be_edited_by`
- `source/games/permissions.py` — add `GameEditPermission`
- `source/games/serializers/game_update.py` — new file
- `source/games/serializers/__init__.py` — export `GameUpdateSerializer`
- `source/games/views/games.py` — upgrade `game_detail` to PATCH + add `game_access`
- `source/games/views/__init__.py` — export `game_access`
- `source/games/views/characters.py` — fix character access endpoints
- `source/games/urls.py` — add `game-access` URL
- `source/games/tests/models/test_game.py` — add `can_be_edited_by` tests
- `source/games/tests/permissions_test.py` — add `GameEditPermission` tests
- `source/games/tests/serializers/test_game_update.py` — new file
- `source/games/tests/views/games_test.py` — add PATCH and access view tests
- `source/games/tests/views/characters_test.py` — update access tests

## CI Checks

- `source/`: `docker-compose run backend poetry run pytest` (CI job: `backend-test`)
- `source/`: `docker-compose run backend poetry run ruff check .` (CI job: `backend-lint`)

## Notes

- No migration is needed — this adds no new database fields.
- `game_slug` must not be editable via PATCH. The `GameUpdateSerializer` excludes it.
- The `can_be_edited_by` method is added directly to the `Game` model (not via a manager) to mirror the `Character` pattern.
- The character access fix (Step 6) is a behavior change: previously, accessing `/pcs/99999/access.json` for a non-existent character would 404. After this change it returns `{can_edit: false}`. The frontend already handles this correctly (it only reads `can_edit`).
