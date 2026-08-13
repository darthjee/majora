# Plan: Fix factions and game possession photo upload

Issue: [1088-fix-factions-and-game-possession-photo-upload.md](../../issues/1088-fix-factions-and-game-possession-photo-upload.md)

## Overview

`backend/uploads/views.py` keeps a `_PHOTO_HANDLERS` registry mapping each photo model to its
`(permission_check, mark_ready)` pair, used by the upload finalize endpoint. `FactionPhoto` was
never registered when factions shipped (PR #1082), and an audit of every `BasePhoto` subclass
against the registry found `CollectionPhoto` has the identical gap. Both fall through to
`_DEFAULT_HANDLERS`, which assumes a `.game` attribute neither model has, so finalizing either
upload raises `AttributeError`. This plan registers both, adds a regression-guard test so a
future unregistered photo model fails at PR time instead of crashing in production, and adds
finalize-endpoint test coverage for both entities. `GamePossessionPhoto` is already correctly
registered — no code change there, just a regression check that its existing tests stay green.

## Context

- PR #1068 (issue #1066) fixed the same class of bug for `SourcePhoto`.
- PR #1073 (issue #1067) refactored the finalize endpoint into the `_PHOTO_HANDLERS` registry
  now living in `backend/uploads/views.py`.
- PR #1082 (issue #812) added factions but never wired `FactionPhoto` into the registry.
- This is the third occurrence of the same bug pattern, hence the added regression guard.

## Implementation Steps

### Step 1 — Register `FactionPhoto` in `_PHOTO_HANDLERS`

In `backend/uploads/views.py`:

- Import `FactionPhoto` from `games.models` (add to the existing multi-line import block).
- Add `_set_faction_photo` (mirrors `_set_treasure_photo`/`_set_possession_photo` — always
  replaces the faction's current photo):

  ```python
  def _set_faction_photo(faction_photo):
      """Set the faction's photo to `faction_photo`, always replacing any existing one."""
      faction = faction_photo.faction
      faction.photo = faction_photo
      faction.save()
  ```

- Add `_faction_photo_permission` (game-scoped, matching the init endpoint
  `game_faction_photo_upload`'s `EndpointPermission(..., game=game).check(request,
  'game_faction', 'regular', 'photo_upload')` — not the staff-only `Source`/`StlModel` pattern):

  ```python
  def _faction_photo_permission(request, content_object):
      """Return a permission error Response for a FactionPhoto content object, else None."""
      game = content_object.faction.game
      return EndpointPermission(request.user, game=game).check(
          request, 'game_faction', 'regular', 'photo_upload',
      )
  ```

- Register `FactionPhoto: (_faction_photo_permission, _set_faction_photo)` in
  `_PHOTO_HANDLERS`.

### Step 2 — Register `CollectionPhoto` in `_PHOTO_HANDLERS`

In `backend/uploads/views.py`:

- Import `CollectionPhoto` from `miniatures.models`.
- Add `_collection_photo_permission` (staff-only, matching the init endpoint
  `collection_photo_upload`'s `require_staff` gate — same shape as `_stl_model_photo_permission`
  / `_source_photo_permission`):

  ```python
  def _collection_photo_permission(request, content_object):
      """Return a permission error Response for a CollectionPhoto content object, else None.

      `Collection` has no owning-game/ownership concept -- creation and photo upload are both
      uniformly staff-only, so the same `require_staff` gate used by the upload-init endpoint
      applies here too.
      """
      return require_staff(request)
  ```

- Add `_set_collection_photo_if_unset` as a **no-op** (matching the `_set_document_file_if_unset`
  no-op convention): a `Collection` is a gallery where multiple photos coexist, and only the
  first upload is promoted to `Collection.photo` — that promotion already happens at
  upload-**init** time in `collection_photo_upload.py`'s `_create_photo`, not at finalize, so
  finalize has nothing to set:

  ```python
  def _set_collection_photo_if_unset(collection_photo):
      """No-op ready marker for CollectionPhoto: promotion to Collection.photo already happens
      at upload-init time (the first photo in the gallery), not at finalize.
      """
  ```

- Register `CollectionPhoto: (_collection_photo_permission,
  _set_collection_photo_if_unset)` in `_PHOTO_HANDLERS`.

### Step 3 — Add a regression-guard test for the registry itself

Add a new test (in `backend/uploads/tests/views_test.py`, alongside the existing
`TestUploadFinalizeView` class, or a small dedicated test module if that reads better) that
walks every concrete `BasePhoto` subclass and fails if one isn't in `_PHOTO_HANDLERS` (or the
explicit `GamePhoto` allowlist for `_DEFAULT_HANDLERS`):

```python
from games.models import GamePhoto
from games.models.base_photo import BasePhoto
from uploads.views import _PHOTO_HANDLERS

# Models intentionally relying on _DEFAULT_HANDLERS instead of an explicit registry entry.
_DEFAULT_HANDLER_MODELS = {GamePhoto}


class TestPhotoHandlersRegistry(TestCase):
    """Guards against a BasePhoto subclass shipping without a _PHOTO_HANDLERS entry."""

    def test_every_photo_model_has_a_registered_handler(self):
        """Test that every concrete BasePhoto subclass is registered or explicitly allowlisted."""
        # BasePhoto.__subclasses__() only returns direct subclasses -- safe today since every
        # photo model subclasses BasePhoto directly, with no multi-level inheritance.
        concrete_subclasses = {
            model for model in BasePhoto.__subclasses__() if not model._meta.abstract
        }
        unregistered = concrete_subclasses - set(_PHOTO_HANDLERS) - _DEFAULT_HANDLER_MODELS
        assert not unregistered, f'Missing _PHOTO_HANDLERS entries for: {unregistered}'
```

This test must fail before Steps 1–2 are applied (proving it actually catches the bug) and pass
after.

### Step 4 — Add finalize-endpoint tests for `FactionPhoto`

New file `backend/uploads/tests/views_faction_test.py`, following the per-entity test file
convention already used for `views_source_test.py`/`views_stl_model_test.py`. Set up a `Faction`
+ `FactionPhoto`, plus separate `Upload` records for a DM, a player-of-game, and a staff user
not otherwise related to the game (mirroring the `GamePossessionPhoto` fixtures currently in
`views_test.py`, since faction shares the same game-scoped `regular`/`photo_upload` permission
shape). Cover:

- `test_unauthenticated_request_returns_401_for_faction_upload`
- `test_unrelated_user_returns_403_for_faction_upload`
- `test_uploading_status_returns_200_for_faction_upload` (asserts `file_path` in the response)
- `test_uploaded_status_sets_faction_photo_ready`
- `test_uploaded_status_sets_game_faction_photo` (sets `faction.photo` when unset)
- `test_uploaded_status_replaces_existing_game_faction_photo` (always-replace, no "if unset"
  guard — matches `_set_faction_photo`)
- `test_uploading_status_returns_200_for_faction_upload_by_player_of_game`
- `test_uploaded_status_sets_faction_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_faction_upload_by_staff`
- `test_uploaded_status_sets_faction_photo_ready_for_staff`

### Step 5 — Add finalize-endpoint tests for `CollectionPhoto`

New file `backend/uploads/tests/views_collection_test.py`, mirroring the staff-only pattern used
by `views_source_test.py`/`views_stl_model_test.py`. Set up a `Collection` (with no photo set),
a superuser, a staff user, and a regular (non-staff) user. Cover:

- `test_unauthenticated_request_returns_401_for_collection_upload`
- `test_non_staff_user_returns_403_for_collection_upload`
- `test_uploading_status_returns_200_for_collection_upload` (asserts `file_path` in the response)
- `test_uploaded_status_sets_collection_photo_ready`
- `test_uploaded_status_does_not_change_collection_photo_on_second_gallery_upload` — create a
  first `CollectionPhoto` already promoted to `collection.photo` (simulating a prior finalized
  upload), then finalize a second `CollectionPhoto` for the same collection and assert
  `collection.photo` is unchanged (finalize must not re-promote a later gallery upload)
- `test_staff_user_returns_200_for_collection_upload`
- `test_superuser_returns_200_for_collection_upload`

### Step 6 — Regression-check `GamePossessionPhoto`

No code change. Run the existing `GamePossessionPhoto` tests in
`backend/uploads/tests/views_test.py` (search `possession` — the block starting around the
`possession_upload`/`possession_photo` fixtures) and confirm they still pass unmodified, closing
out the issue's "verify possessions" half.

## Files to Change

- `backend/uploads/views.py` — import `FactionPhoto`/`CollectionPhoto`, add their permission and
  mark-ready handler functions, register both in `_PHOTO_HANDLERS`.
- `backend/uploads/tests/views_test.py` — add `TestPhotoHandlersRegistry` (Step 3).
- `backend/uploads/tests/views_faction_test.py` — new file (Step 4).
- `backend/uploads/tests/views_collection_test.py` — new file (Step 5).

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest uploads/` (CI job: `pytest_all`, which
  runs `poetry run pytest --ignore=games/tests/views/ ...` and covers `backend/uploads/`)

## Notes

- Splitting the existing 1549-line `backend/uploads/tests/views_test.py` into one file per
  entity (matching the `views_source_test.py`/`views_stl_model_test.py` convention) is tracked
  separately as issue [#1090](https://github.com/darthjee/majora/issues/1090) — out of scope
  here, and this plan's new `views_faction_test.py`/`views_collection_test.py` files are written
  standalone from the start so they don't need touching when #1090 lands.
- No data migration/backfill for stray `ready=False` `FactionPhoto`/`CollectionPhoto` rows left
  by prior failed finalize attempts in production — explicitly out of scope per the issue.
