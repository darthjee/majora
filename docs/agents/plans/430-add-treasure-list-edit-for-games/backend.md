# Backend Plan: Add treasure list edit for games

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full request/response shape of
both new endpoints. Backend produces both; frontend only consumes them.

## Implementation Steps

### Step 1 — `missing` serializer/query helper

- New file `backend/games/serializers/games/treasures/game_treasure_link.py` with
  `GameTreasureLinkSerializer` (plain `serializers.Serializer`, not a `ModelSerializer` —
  mirrors how `game_treasures.py`'s create path already separates payload validation from
  the model write):
  - `treasure_id = serializers.PrimaryKeyRelatedField(queryset=Treasure.objects.all())`
  - `value = serializers.IntegerField(required=True, min_value=0)`
  - `max_units = serializers.IntegerField(required=False, allow_null=True, min_value=0)`
  - `validate_treasure_id(self, treasure)`: read `game = self.context['game']`; raise
    `serializers.ValidationError` if `treasure.game_type != game.game_type`, or if
    `GameTreasure.objects.filter(game=game, treasure=treasure).exists()` (already linked —
    covers both the M2M case and the "already exclusive to this game" case, which can't
    happen anyway since `_create_game_treasure` always creates the `GameTreasure` row
    alongside the exclusive `Treasure`). Return `treasure`.
  - Register `GameTreasureLinkSerializer` in `backend/games/serializers/__init__.py`
    (import + `__all__`), alongside the existing `GameTreasureUpdateSerializer` import.

### Step 2 — `GET /games/:game_slug/treasures/missing.json`

- New file `backend/games/views/games/game_treasures_missing.py`, mirroring
  `game_treasures_all.py`'s shape:
  ```python
  @api_view(['GET'])
  @authentication_classes([CookieTokenAuthentication])
  @permission_classes([AllowAny])  # authorization enforced inline via GameEditPermission
  def game_treasures_missing(request, game_slug):
      game = get_object_or_404(Game, game_slug=game_slug)
      error_response = GameEditPermission.check(request, game)
      if error_response:
          return error_response
      treasures = Treasure.objects.filter(game_type=game.game_type, game__isnull=True)
      treasures = treasures.exclude(
          Exists(GameTreasure.objects.filter(game=game, treasure=OuterRef('pk'))),
      )
      context = game_treasures_context(game)
      response = paginated_list_response(request, treasures, TreasureListSerializer, context=context)
      response['X-Skip-Cache'] = 'true'
      return response
  ```
  - `game__isnull=True` is the key exclusion the issue's spec glosses over: without it, a
    treasure exclusive to a *different* game with a matching `game_type` would incorrectly
    show up as "missing" here (it can never legitimately be linked to this game). Treasures
    already exclusive to *this* game are excluded anyway by the `Exists(...)` check, since
    `_create_game_treasure` always creates their `GameTreasure` row at the same time.
  - Order by `id` (or reuse `_apply_ordering`'s default ascending-value convention) — no
    ordering/search/max_value params requested by the issue; keep this endpoint minimal.
  - `X-Skip-Cache: true` mirrors `game_treasures_all.py` (DM-only endpoints on this page
    family consistently skip the shared HTTP cache).
- Register in `backend/games/urls/games.py`, as a sibling of `treasures/all.json`:
  ```python
  path(
      'games/<slug:game_slug>/treasures/missing.json',
      views.game_treasures_missing,
      name='game-treasures-missing',
  ),
  ```
- Register `game_treasures_missing` in `backend/games/views/games/__init__.py` (import +
  `__all__`).

### Step 3 — `POST /games/:game_slug/treasures/link.json`

- New file `backend/games/views/games/game_treasure_link.py`:
  ```python
  @api_view(['POST'])
  @authentication_classes([CookieTokenAuthentication])
  @permission_classes([AllowAny])  # authorization enforced inline via GameEditPermission
  def game_treasure_link(request, game_slug):
      game = get_object_or_404(Game, game_slug=game_slug)
      error_response = GameEditPermission.check(request, game)
      if error_response:
          return error_response

      serializer = GameTreasureLinkSerializer(data=request.data, context={'game': game})
      error_response = validated_or_error(serializer)
      if error_response:
          return error_response

      hidden_serializer = HiddenFieldSerializer(data=request.data)
      error_response = validated_or_error(hidden_serializer)
      if error_response:
          return error_response

      treasure = serializer.validated_data['treasure_id']
      GameTreasure.objects.create(
          game=game,
          treasure=treasure,
          value=serializer.validated_data['value'],
          max_units=serializer.validated_data.get('max_units'),
          hidden=hidden_serializer.validated_data.get('hidden', False),
      )
      detail = TreasureDetailSerializer(treasure, context={'game': game})
      return Response(detail.data, status=201)
  ```
  - Reuses `HiddenFieldSerializer` the same way `_create_game_treasure` already does, for
    consistent `hidden` validation (real booleans and `"true"`/`"false"` strings, 400 on
    ambiguous input) instead of duplicating that logic in `GameTreasureLinkSerializer`.
- Register in `backend/games/urls/games.py`:
  ```python
  path(
      'games/<slug:game_slug>/treasures/link.json',
      views.game_treasure_link,
      name='game-treasure-link',
  ),
  ```
- Register `game_treasure_link` in `backend/games/views/games/__init__.py`.

### Step 4 — Tests

- `backend/games/tests/views/games/game_treasures_missing_test.py` — mirror
  `game_treasures_all_test.py`'s structure. Cover: 401 unauthenticated, 403 non-DM, DM/superuser
  200; a catalog treasure with matching `game_type` and no `GameTreasure` row appears; a
  catalog treasure already linked (has a `GameTreasure` row for this game) is excluded; a
  treasure exclusive to a *different* game with the same `game_type` is excluded even though
  `game_type` matches; a catalog treasure of a *different* `game_type` is excluded; pagination
  works; `X-Skip-Cache` header is set.
- `backend/games/tests/views/games/game_treasure_link_test.py` — mirror
  `game_treasures_test.py`'s `TestGameTreasuresCreate` structure. Cover: 401 unauthenticated,
  403 non-DM, DM/superuser 201 with a `GameTreasure` row created (`value`/`max_units`/`hidden`
  all persisted correctly, including the `hidden`/`max_units` omitted-defaults case); 400 when
  `treasure_id` doesn't exist; 400 when `treasure_id`'s `game_type` doesn't match the game's;
  400 when the treasure is already linked to this game (both the M2M-already-linked case and,
  as a defensive check, a treasure exclusive to this same game); 400 on a non-boolean `hidden`
  value (mirrors `HiddenFieldSerializer`'s existing test coverage elsewhere); response detail
  shape matches `TreasureDetailSerializer`.
- Update `backend/games/tests/factories.py` only if a new factory trait is convenient for
  building an unlinked catalog treasure — check `TreasureFactory`'s existing traits first;
  likely no change needed since a plain `TreasureFactory()` with no `game` already produces
  this shape.

### Step 5 — Docs

- `docs/agents/access-control/game-treasure.md` — update the "Create/Delete the `(game,
  treasure)` link itself" row: it is no longer admin-only for creation — add
  `POST /games/:slug/treasures/link.json` (**GameEdit**) as the new application-level create
  path, keeping delete as admin-only/out of scope (unchanged).
- `docs/agents/access-control/treasure.md` — add a row (or a note under the existing
  "Create by game" row) for `GET /games/:slug/treasures/missing.json` (**GameEdit** — lists
  catalog treasures of the game's `game_type` not yet linked to it) and for
  `POST /games/:slug/treasures/link.json` (**GameEdit** — creates a `GameTreasure` for an
  existing treasure; distinct from `POST /games/:slug/treasures.json`, which creates a new
  exclusive `Treasure`).

## Files to Change

- `backend/games/serializers/games/treasures/game_treasure_link.py` — new
  `GameTreasureLinkSerializer`
- `backend/games/serializers/__init__.py` — register the new serializer
- `backend/games/views/games/game_treasures_missing.py` — new view
- `backend/games/views/games/game_treasure_link.py` — new view
- `backend/games/views/games/__init__.py` — register both new views
- `backend/games/urls/games.py` — two new routes
- `backend/games/tests/views/games/game_treasures_missing_test.py` — new tests
- `backend/games/tests/views/games/game_treasure_link_test.py` — new tests
- `docs/agents/access-control/game-treasure.md`, `docs/agents/access-control/treasure.md`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers both new view test files (siblings of
  `game_treasures_test.py`/`game_treasures_all_test.py` under `games/tests/views/games/`)
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers
  the serializer/factory changes

## Notes

- Run inside the project containers per `AGENTS.md` (e.g. `docker-compose run --rm
  majora_tests pytest ...`), never directly on the host.
- Keep `game_treasures_missing`/`game_treasure_link` as two independent, thin views (like
  `game_treasures_all.py`) rather than folding either into the existing `game_treasures`
  view — the existing view's `GET`/`POST` split already has distinct semantics (list active
  catalog vs. create exclusive treasure); overloading it further with a third "link existing"
  branch would make its dispatch harder to follow than one extra file.
