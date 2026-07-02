# Backend Plan: Add cover photo to games

Main plan: [plan.md](plan.md)

## Shared contracts

- `GameListSerializer` and `GameDetailSerializer` both gain a read-only field
  `cover_photo_path` (`string | null`): `game.cover_photo.path` when
  `game.cover_photo` is set, else `null`. This is the contract the frontend
  agent relies on — field name, nullability, and the fact it's additive
  (existing `photo` field is untouched).

## Implementation Steps

### Step 1 — Add `Game.cover_photo` FK

In `source/games/models/game.py`, add:

```python
cover_photo = models.ForeignKey(
    'games.GamePhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
)
```

Use a string reference (`'games.GamePhoto'`) since `GamePhoto` is defined in
a separate module (`games/models/game_photo.py`) that already imports
`Game` — a direct import would create a circular import. `related_name='+'`
avoids adding a reverse accessor (not needed here; `GamePhoto` is already
reachable from `Game` via the existing `photos` related name).

Generate the migration (adds `cover_photo_id`, nullable FK to
`games_gamephoto` with `on_delete=SET_NULL`):

```bash
docker-compose run majora_app poetry run python manage.py makemigrations games
```

### Step 2 — Remove `GamePhoto.url`

In `source/games/models/game_photo.py`, delete the `url` field entirely.
Update `__str__` (currently returns `self.url`) to return something sensible
instead — use `self.path` (mirrors the pattern of returning the field that
actually carries data, matching how `Photo`/similar models stringify; check
`source/games/models/photo.py` for the existing convention before deciding
the exact fallback if `path` can be blank).

Generate the migration removing the `url` column (can be combined with Step
1's migration or a separate one — either is fine, but keep them in the same
PR):

```bash
docker-compose run majora_app poetry run python manage.py makemigrations games
```

Update `source/games/serializers/game_photo.py` (`GamePhotoSerializer`):
remove `'url'` from `Meta.fields`, leaving just `['id']` unless another
existing field should stay — check current file content, it currently has
only `id` and `url`, add `path` if useful, but only if not otherwise out of
scope; per the issue, just drop `url` (fields becomes `['id']`).

Update tests referencing `GamePhoto.url` / the serializer's `url` field:
- `source/games/tests/models/test_game_photo.py` — replace
  `GamePhoto.objects.create(url=..., ...)` calls and the
  `test_game_photo_str` / `url` assertions with `path=`-based equivalents.
- `source/games/tests/serializers/test_game_photo.py` — remove
  `test_serializes_url`, and update `setup_method`/other tests that pass
  `url=` to the model factory to use `path=` instead.
- `source/games/tests/serializers/test_game_detail.py` — the
  `test_serializes_nested_photos` test creates `GamePhoto(url=...)` and
  asserts `data['photos']` entries contain a `url` key; update to create
  photos via `path=` and assert on `id`/whatever fields remain instead.

Search for any other production or test reference to `GamePhoto.url` /
`GamePhotoSerializer`'s `url` field before finishing this step:

```bash
docker-compose run majora_app grep -rn "GamePhoto(.*url\|gamephoto.*url\|photo\.url" games --include=*.py
```

### Step 3 — Set the cover photo when an upload finishes

In `source/games/views/upload_finalize.py`, `_mark_content_object_ready`
currently just flips `ready = True` on the upload's `content_object`
(always a `GamePhoto` in the current codebase — it's the only type ever
attached to `Upload.content_object`, see `views/photo_upload.py`). Extend it
so that, after marking the photo ready, the linked game's `cover_photo` is
set to this photo when the game doesn't already have one:

```python
def _mark_content_object_ready(upload):
    """Set the upload's content object to ready and persist it, updating the game's cover photo."""
    content_object = upload.content_object
    content_object.ready = True
    content_object.save()
    game = content_object.game
    if game.cover_photo_id is None:
        game.cover_photo = content_object
        game.save()
```

Add tests to `source/games/tests/views/upload_finalize_test.py`:
- `status=uploaded` sets `game.cover_photo` to the `GamePhoto` when the game
  previously had no cover photo (mirrors the existing
  `test_uploaded_status_sets_game_photo_ready` pattern — assert on
  `self.game.refresh_from_db()` then `self.game.cover_photo == self.game_photo`).
- `status=uploaded` does **not** overwrite an existing `game.cover_photo`
  when one is already set (set `self.game.cover_photo` to a different,
  pre-existing `GamePhoto` in the test before issuing the PATCH, then assert
  it is unchanged after).

### Step 4 — Deleting a cover photo clears it

Add a model test in `source/games/tests/models/test_game_photo.py` (or a new
`source/games/tests/models/test_game.py` if more appropriate — check
whether one already exists) asserting that deleting a `GamePhoto` currently
set as a game's `cover_photo` sets `Game.cover_photo` back to `None`,
relying purely on the `on_delete=models.SET_NULL` behavior configured in
Step 1 — no extra signal/code needed.

### Step 5 — Expose `cover_photo_path` on the Game API

In `source/games/serializers/game_list.py`:

```python
class GameListSerializer(serializers.ModelSerializer):
    cover_photo_path = serializers.CharField(source='cover_photo.path', default=None, read_only=True)

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo', 'cover_photo_path']
```

Verify `default=None` is actually honored on a nested `source=` lookup with
DRF's `CharField` — if `game.cover_photo` is `None`, `source='cover_photo.path'`
will raise `AttributeError` internally unless DRF's attribute traversal
catches it and falls back to `default`. DRF's `Field.get_attribute` does
catch `AttributeError` on the traversal and returns `default` when set, so
this should work, but confirm with a test (below) rather than assuming.

Apply the identical field to `source/games/serializers/game_detail.py`,
adding `'cover_photo_path'` to `Meta.fields` there too.

Add tests:
- `source/games/tests/serializers/test_game_list.py` (check if this file
  exists; if not, check how `GameListSerializer` is currently tested and add
  alongside it) — `cover_photo_path` is `null` when no cover photo is set,
  and equals `game.cover_photo.path` when one is set.
- `source/games/tests/serializers/test_game_detail.py` — same two cases.

### Step 6 — Run the full backend test suite and lint

```bash
docker-compose run majora_app poetry run pytest
docker-compose run majora_app poetry run flake8 .
```

(confirm the exact lint command/tool by checking the `checks` job in
`.circleci/config.yml` if `flake8` isn't what's configured.)

## Files to Change
- `source/games/models/game.py` — add `cover_photo` FK field.
- `source/games/models/game_photo.py` — remove `url` field, update `__str__`.
- `source/games/migrations/00XX_*.py` — new migration(s) for `cover_photo` FK and `url` removal.
- `source/games/serializers/game_photo.py` — drop `url` from `Meta.fields`.
- `source/games/serializers/game_list.py` — add `cover_photo_path` field.
- `source/games/serializers/game_detail.py` — add `cover_photo_path` field.
- `source/games/views/upload_finalize.py` — set `game.cover_photo` in `_mark_content_object_ready`.
- `source/games/tests/models/test_game_photo.py` — update for `url` removal, add cover-photo `SET_NULL` test.
- `source/games/tests/serializers/test_game_photo.py` — update for `url` removal.
- `source/games/tests/serializers/test_game_detail.py` — update nested photo assertions, add `cover_photo_path` tests.
- `source/games/tests/serializers/test_game_list.py` — add `cover_photo_path` tests (create if missing).
- `source/games/tests/views/upload_finalize_test.py` — add cover-photo-set-on-first-upload and not-overwritten tests.

## CI Checks
- `source`: `docker-compose run majora_app poetry run pytest games/tests/views/` (CI job: `pytest_views`)
- `source`: `docker-compose run majora_app poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)
- `source`: whatever lint command backs the `checks` job in `.circleci/config.yml` — confirm exact tool/command there before relying on it.

## Notes
- `Upload.content_object` is only ever a `GamePhoto` in the current codebase
  (confirmed via `views/photo_upload.py`), so it's safe to access
  `content_object.game` directly in `_mark_content_object_ready` without a
  type check.
- No backfill migration is needed for existing games per the issue — only
  applies going forward from new uploads.
- Double-check whether `source/games/serializers/__init__.py` needs no
  changes (it already exports `GameListSerializer`/`GameDetailSerializer` by
  name, and no new serializer class is being added — only fields on existing
  ones).
