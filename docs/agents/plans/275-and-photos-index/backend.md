# Backend Plan: Add photo index pages for games and characters

Main plan: [plan.md](plan.md)

## Shared contracts

- Must expose `id` and `path` on both `GamePhotoSerializer` and
  `CharacterPhotoSerializer` (currently `fields = ['id']` only).
- Must add three new `AllowAny`, paginated (`Paginator`/`paginated_list_response`)
  GET endpoints:
  - `GET /games/<slug>/photos.json`
  - `GET /games/<slug>/pcs/<id>/photos.json`
  - `GET /games/<slug>/npcs/<id>/photos.json`
- Each endpoint returns only photos with `ready=True`.
- Response body/headers must follow the exact pagination shape already used
  by `game_treasures` (`page`/`per_page` request params; `page`/`pages`/
  `per_page`/`total` response headers; plain JSON array body).

## Implementation Steps

### Step 1 — Expose `path` on the photo serializers

Edit `source/games/serializers/game_photo.py` and
`source/games/serializers/character_photo.py` to add `'path'` to `fields`
(alongside the existing `'id'`). These serializers are also used by
`GameDetailSerializer`/`CharacterDetailSerializer` for the (currently broken)
embedded `photos` field — adding `path` there is safe and desirable since it
finally makes the embedded `id`-only data usable, but it does **not** need
its own list-serializer variant: reuse the same serializer class for both
the embedded field and the new list endpoints, since the shape is identical
(`id`, `path`). Do not filter `ready` inside the serializer itself — the
`ready=True` filter belongs in the queryset built by each new view (see Step
2), so the existing embedded `photos` field's behavior on the detail
serializers is unchanged (still shows all photos, ready or not, exactly as
today).

### Step 2 — Add the three new views

Add:
- `source/games/views/games/game_photos.py` — `game_photos(request, game_slug)`,
  mirroring `source/games/views/games/game_treasures.py`: fetch the `Game`
  via `get_object_or_404`, then
  `paginated_list_response(request, game.photos.filter(ready=True), GamePhotoSerializer)`.
- `source/games/views/characters/game_pc_photos.py` — `game_pc_photos(request, game_slug, character_id)`,
  mirroring `source/games/views/characters/game_pc_detail.py`'s lookup
  (`Character.objects.get(id=character_id, game=game, npc=False)`), then
  `paginated_list_response(request, character.photos.filter(ready=True), CharacterPhotoSerializer)`.
- `source/games/views/characters/game_npc_photos.py` — same as above with
  `npc=True`.

Register each in the corresponding `__init__.py`
(`source/games/views/games/__init__.py`, `source/games/views/characters/__init__.py`)
and in `source/games/urls.py`, following the existing naming convention:
- `name='game-photos'` for `games/<slug:game_slug>/photos.json`
- `name='game-pc-photos'` for `games/<slug:game_slug>/pcs/<int:character_id>/photos.json`
- `name='game-npc-photos'` for `games/<slug:game_slug>/npcs/<int:character_id>/photos.json`

Place the new `photos.json` routes near the existing `pcs.json`/`npcs.json`/
`treasures.json`/`photo_upload.json` entries in `urls.py` for readability.

### Step 3 — Tests

Add view tests (mirroring `source/games/tests/views/games/game_treasures_test.py`
and the PC/NPC detail test structure) covering:
- 200 with paginated body/headers for each of the three endpoints.
- Only `ready=True` photos are returned (create a `ready=False` photo and
  assert it's excluded).
- 404 when the game/character does not exist, or the character exists but
  belongs to the wrong game/is the wrong `npc` type (same as existing
  PC/NPC detail 404 tests).
- Serializer tests for `GamePhotoSerializer`/`CharacterPhotoSerializer`
  asserting `path` is now present in the serialized output (extend
  `source/games/tests/serializers/test_game_photo.py` and
  `test_character_photo.py`).

## Files to Change

- `source/games/serializers/game_photo.py` — add `path` to `fields`
- `source/games/serializers/character_photo.py` — add `path` to `fields`
- `source/games/views/games/game_photos.py` — new view
- `source/games/views/games/__init__.py` — export `game_photos`
- `source/games/views/characters/game_pc_photos.py` — new view
- `source/games/views/characters/game_npc_photos.py` — new view
- `source/games/views/characters/__init__.py` — export `game_pc_photos`, `game_npc_photos`
- `source/games/urls.py` — register the three new routes
- `source/games/tests/serializers/test_game_photo.py` — assert `path` field
- `source/games/tests/serializers/test_character_photo.py` — assert `path` field
- `source/games/tests/views/games/game_photos_test.py` — new
- `source/games/tests/views/characters/game_pc_photos_test.py` — new
- `source/games/tests/views/characters/game_npc_photos_test.py` — new

## CI Checks

- `source/`: `docker-compose run --rm backend poetry run pytest games/tests/views/` (CI job: `pytest_views`)
- `source/`: `docker-compose run --rm backend poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)

## Notes

- Do not add a `ready` filter to the serializer — keep it in the view's
  queryset, so the embedded `photos` field on the detail serializers keeps
  its current (unfiltered) behavior and only the new dedicated endpoints
  change behavior.
- `data-access` review should be invoked once these are implemented, since
  three new public read endpoints are added.
