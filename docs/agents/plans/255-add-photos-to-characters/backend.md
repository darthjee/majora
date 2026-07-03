# Backend Plan: Add photos to characters

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full picture. This agent produces:
- The `CharacterPhoto` model, `Character.profile_photo` field, and the migration.
- `CharacterPhotoSerializer`, and `profile_photo_path` on `CharacterListSerializer` /
  `CharacterDetailSerializer`.
- The two new upload-init endpoints (`.../pcs/<id>/photo_upload.json`,
  `.../npcs/<id>/photo_upload.json`) reusing `CharacterEditPermission`.
- The generalized `PATCH /uploads/<id>.json` (dispatch on content object type).
- Removal of the legacy `Photo` model and `PhotoSerializer`.

## Implementation Steps

### Step 1 — Add the `CharacterPhoto` model

Create `source/games/models/character_photo.py`, mirroring
`source/games/models/game_photo.py`:

```python
class CharacterPhoto(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='photos')
    path = models.CharField(max_length=512, blank=True, default='')
    ready = models.BooleanField(default=False)

    def __str__(self):
        return self.path
```

### Step 2 — Add `Character.profile_photo`

In `source/games/models/character.py`, add:

```python
profile_photo = models.ForeignKey(
    'games.CharacterPhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
)
```

(same shape as `Game.cover_photo` in `source/games/models/game.py`).

### Step 3 — Remove the legacy `Photo` model

Delete `source/games/models/photo.py`. Update:
- `source/games/models/__init__.py` — replace the `Photo` import/export with `CharacterPhoto`.
- `source/games/admin.py` — replace `Photo` with `CharacterPhoto` in both the import and the
  `admin.site.register(...)` call.

### Step 4 — Migration

Add a single migration (next number after `0026`, i.e. `0027_...`) in
`source/games/migrations/`, mirroring the structure of
`0026_remove_gamephoto_url_game_cover_photo.py`, with operations in this order:
1. `CreateModel('CharacterPhoto', ...)`
2. `AddField('character', 'profile_photo', ...)`
3. `DeleteModel('Photo')`

This order avoids a reverse-accessor clash on `Character.photos` between the old `Photo`
model and the new `CharacterPhoto` model within the migration state. Generate it with
`docker-compose run --rm majora_tests python manage.py makemigrations games` after Steps 1-3
are in place, then review the generated file for correctness (field order, `related_name`,
`on_delete`) before committing.

### Step 5 — Serializers

- Create `source/games/serializers/character_photo.py`:
  ```python
  class CharacterPhotoSerializer(serializers.ModelSerializer):
      class Meta:
          model = CharacterPhoto
          fields = ['id']
  ```
  (mirrors `GamePhotoSerializer` post-#254 — no `url` field).
- Delete `source/games/serializers/photo.py`.
- In `source/games/serializers/character_detail.py`: replace the `PhotoSerializer` import/use
  with `CharacterPhotoSerializer`, and add:
  ```python
  profile_photo_path = serializers.CharField(
      source='profile_photo.path', default=None, read_only=True
  )
  ```
  to both the class body and `Meta.fields` (mirroring `GameDetailSerializer`'s
  `cover_photo_path`). `CharacterFullSerializer` inherits this automatically.
- In `source/games/serializers/character_list.py`: add the same `profile_photo_path` field
  and add it to `Meta.fields` (mirroring `GameListSerializer`'s `cover_photo_path`).
- Update `source/games/serializers/__init__.py` — swap the `PhotoSerializer` export for
  `CharacterPhotoSerializer`.

### Step 6 — Upload-init endpoints for character photos

Reuse the existing `PhotoUploadSerializer` (filename validation) as-is — it is already
generic (no game-specific fields).

Add a shared implementation (e.g. a private helper in a new
`source/games/views/characters/_photo_upload.py`, following the existing
`_shared.py`/`_find_character` convention) parametrized by `npc: bool`, and two thin public
views:
- `source/games/views/characters/game_pc_photo_upload.py` → `game_pc_photo_upload(request, game_slug, character_id)`
- `source/games/views/characters/game_npc_photo_upload.py` → `game_npc_photo_upload(request, game_slug, character_id)`

Each: look up the character via `_find_character(game, character_id, npc=<bool>)` (404 if
missing), run `CharacterEditPermission.check(request, character)`, validate the filename via
`PhotoUploadSerializer`, build a file path (e.g.
`photos/games/<game_slug>/characters/<character_id>/<stem>_<uuid><ext>`, following
`_build_file_path` in `source/games/views/photo_upload.py`), create the `Upload` and
`CharacterPhoto` rows (mirroring `photo_upload` in `source/games/views/photo_upload.py`), and
return `{"id": upload.id, "token": upload.token}` with status 201.

Register both in `source/games/urls.py`:
```python
path('games/<slug:game_slug>/pcs/<int:character_id>/photo_upload.json',
     views.game_pc_photo_upload, name='game-pc-photo-upload'),
path('games/<slug:game_slug>/npcs/<int:character_id>/photo_upload.json',
     views.game_npc_photo_upload, name='game-npc-photo-upload'),
```

Update `source/games/views/characters/__init__.py` and `source/games/views/__init__.py`
exports accordingly.

### Step 7 — Generalize `upload_finalize.py`

In `source/games/views/upload_finalize.py`:
- `_check_game_permission` (rename to something like `_check_permission`) must dispatch on
  the type of `upload.content_object`: `GameEditPermission.check(request, content_object.game)`
  for a `GamePhoto`, `CharacterEditPermission.check(request, content_object.character)` for a
  `CharacterPhoto`.
- `_mark_content_object_ready` must dispatch similarly: call the existing
  `_set_cover_photo_if_unset` for a `GamePhoto`, and a new `_set_profile_photo_if_unset` for a
  `CharacterPhoto` (mirrors `_set_cover_photo_if_unset`, setting `character.profile_photo` on
  the photo's `character` when unset).
- Import `CharacterPhoto` and `CharacterEditPermission` in this module.

### Step 8 — Tests

- `source/games/tests/models/test_character_photo.py` (new) — mirrors
  `tests/models/test_game_photo.py` (creation, `__str__`, `related_name`, and
  delete-clears-`profile_photo` cases). Delete `tests/models/test_photo.py`.
- `source/games/tests/serializers/test_character_photo.py` (new) — mirrors
  `tests/serializers/test_game_photo.py` (`id` serialized, `character` not exposed). Delete
  `tests/serializers/test_photo.py`.
- `source/games/tests/serializers/test_character_detail.py` — replace `Photo.objects.create`
  calls with `CharacterPhoto.objects.create(path=..., character=...)`, update the "nested
  photos" assertions to check `id` only (mirroring the `test_game_detail.py` diff from
  #254), and add `profile_photo_path` unset/set cases (mirroring
  `test_serializes_cover_photo_path_as_none_when_unset` /
  `test_serializes_cover_photo_path_when_set` in `test_game_detail.py`).
- `source/games/tests/serializers/test_character_list.py` — add the equivalent
  `profile_photo_path` unset/set cases (mirroring the `test_game_list.py` diff from #254).
- `source/games/tests/views/characters/game_pc_detail_test.py` and
  `game_npc_detail_test.py` — replace `Photo.objects.create` with
  `CharacterPhoto.objects.create`.
- `source/games/tests/views/characters/game_pc_photo_upload_test.py` and
  `game_npc_photo_upload_test.py` (new) — mirror `tests/views/photo_upload_test.py`
  end-to-end (401/403/404/400 cases, happy path, `CharacterPhoto` record creation,
  superuser access, session-cookie auth), adapted to `CharacterEditPermission` (player of the
  character, DM of the game, or superuser may upload; an unrelated authenticated user gets
  403).
- `source/games/tests/views/upload_finalize_test.py` — add a parallel set of cases for a
  `CharacterPhoto`-backed upload (permission dispatch to `CharacterEditPermission`,
  `status=uploaded` sets `CharacterPhoto.ready` and `character.profile_photo` when unset, and
  does not overwrite an existing `profile_photo`), mirroring the existing `GamePhoto` cases in
  the same file.
- Update `source/games/tests/permissions_test.py` only if it enumerates concrete
  usages/models — check first; likely no change needed since `CharacterEditPermission` itself
  is unchanged.

### Step 9 — Local verification

Run inside the containers (never on the host):
```bash
docker-compose run --rm majora_tests python manage.py makemigrations --check --dry-run games
docker-compose run --rm majora_tests pytest
docker-compose run --rm majora_tests ruff check .
```

## Files to Change

- `source/games/models/character_photo.py` — new `CharacterPhoto` model
- `source/games/models/character.py` — add `profile_photo` FK
- `source/games/models/photo.py` — deleted
- `source/games/models/__init__.py` — swap `Photo` → `CharacterPhoto`
- `source/games/admin.py` — swap `Photo` → `CharacterPhoto`
- `source/games/migrations/0027_*.py` — new migration
- `source/games/serializers/character_photo.py` — new `CharacterPhotoSerializer`
- `source/games/serializers/photo.py` — deleted
- `source/games/serializers/character_detail.py` — `profile_photo_path`, swap photo serializer
- `source/games/serializers/character_list.py` — `profile_photo_path`
- `source/games/serializers/__init__.py` — export swap
- `source/games/views/characters/_photo_upload.py` — new shared upload-init logic
- `source/games/views/characters/game_pc_photo_upload.py` — new view
- `source/games/views/characters/game_npc_photo_upload.py` — new view
- `source/games/views/characters/__init__.py` — export new views
- `source/games/views/__init__.py` — export new views
- `source/games/views/upload_finalize.py` — dispatch on content object type
- `source/games/urls.py` — two new routes
- Tests listed in Step 8

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views`,
  `pytest_all`)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- Confirm whether `character.editors` / `is_editor` already covers the "player of this
  character" case used by `CharacterEditPermission` for the new upload endpoints — it does
  (see `Character.can_be_edited_by` in `source/games/models/character.py`); no permission
  logic changes needed beyond reusing `CharacterEditPermission.check`.
- The exact upload file-path convention
  (`photos/games/<slug>/characters/<id>/<stem>_<uuid><ext>`) is a suggestion for consistency
  with the existing `photos/games/<slug>/<stem>_<uuid><ext>` convention; adjust if a cleaner
  convention fits the codebase better, but keep it deterministic and collision-resistant
  (existing code appends a random UUID).
- Double-check `source/games/tests/permissions_test.py` and any other file referencing
  `Photo` (search for `\bPhoto\b` excluding `GamePhoto`/`CharacterPhoto`/`PhotoSerializer`/
  `PhotoUpload*`) before finishing, to make sure no stray import of the deleted model remains.
