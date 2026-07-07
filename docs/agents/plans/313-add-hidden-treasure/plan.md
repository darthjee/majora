# Plan: Add hidden treasure

Issue: [313-add-hidden-treasure.md](../issues/313-add-hidden-treasure.md)

## Overview

Add a `hidden` boolean field to `Treasure`, filter it out of the public `GET /games/<slug>/treasures.json` catalog, and add a new DM/superuser-only `GET /games/<slug>/treasures/all.json` endpoint that returns the full catalog (hidden and visible), mirroring the existing `game_npcs_all` precedent for hidden NPCs. This is entirely within the `backend` agent's scope — no frontend wiring (deferred to #312's acquire modal, which does not yet call `treasures/all.json`).

## Context

- `Treasure` (`source/games/models/treasure.py`) currently has no visibility flag: `name`, `value`, `photo`, `game` (FK for game-exclusive treasures). Treasures are also linkable to games via `Game.treasures` (M2M, `related_name='linked_games'`, `related_query_name='linked_game'`).
- `game_treasures` (`source/games/views/games/game_treasures.py`) is a combined `GET`/`POST` view: `GET` lists `Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()`, further filtered by an optional `max_value` query param, and returned via `paginated_list_response(request, treasures, TreasureListSerializer)`. `POST` creates a treasure exclusive to the game via `GameEditPermission.check` + `TreasureCreateSerializer`.
- `TreasureCreateSerializer`/`TreasureUpdateSerializer` (`source/games/serializers/treasure_create.py` / `treasure_update.py`) currently only expose `name`/`value`.
- `TreasureListSerializer` (`source/games/serializers/treasure_list.py`) exposes `id`, `name`, `value`, `photo_path`, `game_slug` — this is what both `treasures.json` and the new `treasures/all.json` will use.
- The precedent to mirror is `game_npcs_all` (`source/games/views/characters/game_npcs_all.py`): resolves the game, calls `GameEditPermission.check(request, game)` and returns its error response if any (401 unauthenticated / 403 non-DM), otherwise builds an unfiltered queryset, serializes with the existing list serializer via `paginated_list_response`, and manually sets `response['X-Skip-Cache'] = 'true'` before returning. Its URL is registered as `games/<slug:game_slug>/npcs/all.json` in `source/games/urls.py`, and its test file `source/games/tests/views/characters/game_npcs_all_test.py` is the shape to mirror for the new endpoint's tests (401/403/200-DM/200-superuser/404-unknown-game/pagination-headers/X-Skip-Cache-header/does-not-leak-other-kind cases).
- `GameEditPermission.check` lives in `source/games/permissions.py`.
- Latest migration is `source/games/migrations/0035_alter_charactertreasure_unique_together.py`, so the new migration is `0036_treasure_hidden.py`.
- `TreasureFactory` (`source/games/tests/factories.py`) has no `hidden` field yet; `game_npcs_all_test.py`'s `CharacterFactory(..., hidden=True)` usage shows the expected factory-kwarg pattern once the model field exists (default `factory.django.DjangoModelFactory` already accepts any model field as a kwarg without needing an explicit factory attribute, but adding `hidden = False` explicitly keeps parity with how other boolean flags are declared in this factories file).
- Views for this endpoint belong in `source/games/views/games/` (game-scoped, not character-scoped) alongside `game_treasures.py`, registered in `source/games/views/games/__init__.py` and re-exported from `source/games/views/__init__.py`, consistent with how `game_treasures`/`game_treasure_detail` are already wired there (unlike `game_npcs_all`, which lives under `views/characters/` because NPCs are character-scoped — treasures-all is game-scoped like `game_treasures`, so it belongs next to it, not literally copied into `views/characters/`).

## Implementation Steps

### Step 1 — Model + migration

1. Add `hidden = models.BooleanField(default=False)` to `Treasure` in `source/games/models/treasure.py`.
2. Generate the migration (`0036_treasure_hidden.py`) via the containerized toolchain, e.g. `docker-compose run backend poetry run python manage.py makemigrations games` — never run `python`/`poetry` directly on the host.

### Step 2 — Serializers

1. Add `'hidden'` to `TreasureCreateSerializer.Meta.fields` (`source/games/serializers/treasure_create.py`) — not required, so it defaults to `False` via the model default when omitted; no `extra_kwargs` entry needed unless DRF requires one for a plain `BooleanField` (it does not, by default `required=False` for model `BooleanField` with a default).
2. Add `'hidden'` to `TreasureUpdateSerializer.Meta.fields` (`source/games/serializers/treasure_update.py`), consistent with `name`'s `required: False` pattern (again no extra kwarg needed for a `BooleanField` with a model default).

### Step 3 — Filter the public catalog

In `game_treasures` (`source/games/views/games/game_treasures.py`), add `.filter(hidden=False)` to the `GET` queryset in the main `game_treasures` function (alongside the existing `Q(linked_game=game) | Q(game=game)).distinct()` chain, before `_filter_by_max_value`), so hidden treasures never appear in `GET /games/<slug>/treasures.json`.

### Step 4 — New `treasures/all.json` endpoint

1. Create `source/games/views/games/game_treasures_all.py`, mirroring `game_npcs_all.py`:
   - `@api_view(['GET'])`, `@authentication_classes([CookieTokenAuthentication])`, `@permission_classes([AllowAny])` (authorization is enforced inline via `GameEditPermission.check`, same rationale as `game_npcs_all` and `game_treasures`'s POST branch).
   - Resolve the game via `get_object_or_404(Game, game_slug=game_slug)`.
   - Call `GameEditPermission.check(request, game)`; return its error response if any.
   - Build the unfiltered queryset `Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()` (no `hidden` filter — this is the whole point of the endpoint), reusing `_filter_by_max_value`-style behavior is **not** required by the issue — omit `max_value` filtering here unless trivial to share; keep the endpoint minimal and matching only what the issue asks for.
   - Serialize via `paginated_list_response(request, treasures, TreasureListSerializer)`, then set `response['X-Skip-Cache'] = 'true'` before returning, exactly like `game_npcs_all`.
2. Register the view:
   - Add `from .game_treasures_all import game_treasures_all` and `'game_treasures_all'` to `source/games/views/games/__init__.py`.
   - Add the import and `__all__` entry to `source/games/views/__init__.py` (alongside the existing `game_treasures`/`game_treasure_detail` entries).
3. Add the URL route to `source/games/urls.py`: `path('games/<slug:game_slug>/treasures/all.json', views.game_treasures_all, name='game-treasures-all')` — place it near the existing `games/<slug:game_slug>/treasures.json` and `treasures/<int:treasure_id>.json` routes (before the more specific `treasures/<int:treasure_id>.json` pattern is not a concern here since `all` is a literal segment distinct from `<int:treasure_id>`, but double-check ordering doesn't shadow the detail route — Django resolves by pattern match, so `all.json` vs an `<int:treasure_id>.json` pattern do not collide regardless of order; still, mirror the existing `npcs/all.json` placement style by keeping it directly under the sibling `treasures.json` route for readability).

### Step 5 — Tests

1. `source/games/tests/models/test_treasure.py` — add/extend a test asserting `hidden` defaults to `False`.
2. `source/games/tests/serializers/test_treasure_create.py` / `test_treasure_update.py` — add tests asserting `hidden` is accepted on create/update and defaults to `False` when omitted.
3. `source/games/tests/views/games/game_treasures_test.py` — add tests asserting hidden treasures (via `TreasureFactory(hidden=True)`, linked or exclusive) are excluded from `GET /games/<slug>/treasures.json`, and that non-hidden treasures are still returned (regression coverage alongside the existing `TestGameTreasuresView` cases).
4. New `source/games/tests/views/games/game_treasures_all_test.py`, mirroring `game_npcs_all_test.py`'s structure/coverage: 401 unauthenticated, 403 non-DM authenticated, 200 for DM returning both hidden and visible treasures, 200 for superuser, 404 unknown game slug, pagination headers present, `X-Skip-Cache: true` header present, and (game-scoping regression) treasures exclusive/linked to a different game are excluded.
5. Update `source/games/tests/factories.py`'s `TreasureFactory` to accept `hidden` (either rely on the implicit DjangoModelFactory field passthrough, or add an explicit `hidden = False` default attribute for consistency with how other boolean fields are declared elsewhere in that file — check the file for the prevailing convention before choosing).
6. Confirm character-owned treasure listing tests (`game_pc_treasures_test.py` / `game_npc_treasures_test.py` under `source/games/tests/views/characters/`) still pass unmodified — no new test needed there since `CharacterTreasueSerializer`/`character_treasures` is explicitly out of scope and unaffected by the `hidden` field, but re-run the suite to confirm no regression.

## Files to Change

- `source/games/models/treasure.py` — add `hidden` boolean field.
- `source/games/migrations/0036_treasure_hidden.py` (new, generated) — migration for the new field.
- `source/games/serializers/treasure_create.py` — add `hidden` to `Meta.fields`.
- `source/games/serializers/treasure_update.py` — add `hidden` to `Meta.fields`.
- `source/games/views/games/game_treasures.py` — filter `GET` queryset by `hidden=False`.
- `source/games/views/games/game_treasures_all.py` (new) — DM/superuser-only endpoint returning the full catalog.
- `source/games/views/games/__init__.py` — export `game_treasures_all`.
- `source/games/views/__init__.py` — export `game_treasures_all`.
- `source/games/urls.py` — add the `games/<slug:game_slug>/treasures/all.json` route.
- `source/games/tests/models/test_treasure.py` — `hidden` default coverage.
- `source/games/tests/serializers/test_treasure_create.py`, `test_treasure_update.py` — `hidden` field coverage.
- `source/games/tests/views/games/game_treasures_test.py` — hidden-exclusion coverage for the public catalog.
- `source/games/tests/views/games/game_treasures_all_test.py` (new) — full coverage for the new endpoint.
- `source/games/tests/factories.py` — `TreasureFactory` gains `hidden` support.

## CI Checks

- `source`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `game_treasures_test.py` and the new `game_treasures_all_test.py`.
- `source`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers model/serializer tests.
- `source`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — regression check that character-owned treasure listings are unaffected.

Run these through the containerized toolchain, e.g. `docker-compose run backend poetry run pytest ...` — never invoke `poetry`/`python` directly on the host.

## Notes

- Frontend wiring is explicitly out of scope per the issue; do not touch `frontend/` for this issue.
- This introduces a new endpoint and a permission-gated visibility change, so a `data-access` review (per the architect's coordination flow) is expected after implementation, checking that `treasures/all.json` correctly restricts to `GameEditPermission` and that `hidden` doesn't leak through any other serializer (e.g. confirm `TreasureListSerializer`/`TreasureDetailSerializer` used elsewhere don't need to expose or hide the `hidden` field itself — the issue doesn't ask for `hidden` to be visible in the response body, only used as a server-side filter/gate).
- `docs/agents/access-control.md` should be updated in the same PR to document the new `treasures/all.json` endpoint and its `GameEditPermission` gate, alongside the existing `npcs/all.json` entry.
