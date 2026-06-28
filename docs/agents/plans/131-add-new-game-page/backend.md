# Backend Plan: Add New Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent must expose `POST /games.json`:
- Auth: `TokenAuthentication`, authenticated user required (401 otherwise).
- Request body: `{ name: string (required), photo: string|null (optional), description: string (optional) }`.
- Success: HTTP 201 with `GameDetailSerializer` body — includes `game_slug` generated from `name` by the `Game.save()` method.
- Validation failure: HTTP 400 with `{ "errors": { <field>: [string, ...] } }`.
- Unauthenticated: HTTP 401 with `{ "errors": { "detail": ["authentication required"] } }`.

## Implementation Steps

### Step 1 — Create GameCreateSerializer

Create `source/games/serializers/game_create.py`:
- `ModelSerializer` for `Game`
- Fields: `name` (required), `photo` (optional, `required=False, allow_null=True`), `description` (optional, `required=False`)
- On `save()` the `Game` model auto-generates `game_slug` from `name`.

Export it from `source/games/serializers/__init__.py`.

### Step 2 — Add POST handler to games_list view

In `source/games/views/games.py`:
- Change `@api_view(['GET'])` to `@api_view(['GET', 'POST'])`.
- Add `@authentication_classes([TokenAuthentication])` and `@permission_classes([AllowAny])` (same pattern as `game_detail`).
- In the view body, branch on `request.method == 'POST'` and call a new private helper `_create_game(request)`.

Implement `_create_game(request)`:
1. Check authentication using the same pattern as `GameEditPermission._unauthenticated_response`. Since any authenticated user may create a game (no ownership check), a simple inline check suffices: if not `request.user` or not `request.user.is_authenticated`, return 401.
2. Validate with `GameCreateSerializer(data=request.data)`.
3. If invalid, return `Response({'errors': serializer.errors}, status=400)`.
4. Call `serializer.save()` and then serialize the result with `GameDetailSerializer` for the response.
5. Return `Response(detail_data, status=201)`.

### Step 3 — Add tests

In `source/games/tests/views/games_test.py`, add a new `TestGamesCreateView` class covering:
- 201 with full `GameDetailSerializer` body on valid POST.
- `game_slug` is auto-generated from `name`.
- 400 with field errors when `name` is missing.
- 401 when no auth token is provided.
- Correct URL accessible by name (`games-list`).

Also add a serializer test in `source/games/tests/serializers/` for `GameCreateSerializer`.

## Files to Change

- `source/games/serializers/game_create.py` — new file: `GameCreateSerializer`
- `source/games/serializers/__init__.py` — export `GameCreateSerializer`
- `source/games/views/games.py` — add POST branch and `_create_game` helper; update decorators
- `source/games/tests/views/games_test.py` — add `TestGamesCreateView` test class
- `source/games/tests/serializers/game_create_test.py` — new file: serializer tests

## CI Checks

- `source/`: `docker-compose run --rm majora_be poetry run pytest` (CI job: `pytest`)

## Notes

- No new URL pattern is needed; `POST /games.json` reuses the `games-list` URL already at `games.json`.
- `game_slug` generation is handled entirely by `Game.save()` — the serializer does not need to accept or validate it.
- Any authenticated user may create a game (no ownership restriction at creation time). Game masters may be added afterwards via the existing `game-masters-list` endpoint.
