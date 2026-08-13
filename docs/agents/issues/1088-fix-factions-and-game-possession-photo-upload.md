# Issue: Fix factions and game possession photo upload

## Description

Photo upload has been fixed iteratively across several PRs: PR #1068 (issue #1066) fixed
miniature/source photo upload, PR #1073 (issue #1067) refactored the upload flow into a generic
`_PHOTO_HANDLERS` registry (now living in `backend/uploads/views.py`), and PR #1082 (issue #812)
added factions. Faction photo upload was never wired into that registry, so it's broken. This
issue fixes that, verifies game possession photo upload (already correctly wired), and — after
an audit of every photo model against the registry — also fixes `CollectionPhoto`, found to have
the identical gap.

## Problem

`backend/uploads/views.py` keeps a `_PHOTO_HANDLERS` registry mapping each photo model to its
`(permission_check, mark_ready)` pair, used by the upload finalize endpoint
(`PATCH /uploads/<upload_type>/<upload_id>.json`).

- **`FactionPhoto` was never added to this registry** when factions shipped in PR #1082. It
  falls through to `_DEFAULT_HANDLERS` (`_game_photo_permission` / `_set_game_photo_if_unset`),
  both of which assume the content object has a `.game` attribute — but `FactionPhoto` only has
  `.faction`. Finalizing a faction photo upload raises `AttributeError`. There is also no
  existing test coverage for it in `backend/uploads/tests/`.
- **Auditing every `BasePhoto` subclass against the registry turned up a second gap:
  `CollectionPhoto`** (`backend/miniatures/models/collection_photo.py`) is also missing, with
  the same `AttributeError` failure mode (`.collection`, not `.game`), and no finalize-level
  test coverage.
- **`GamePossessionPhoto` is already correctly registered**
  (`_game_possession_photo_permission` / `_set_possession_photo`), with full test coverage in
  `backend/uploads/tests/views_test.py` — this part of the issue is a verification, not a fix.
- All other `BasePhoto` subclasses (`CharacterPhoto`, `TreasurePhoto`, `GameItemPhoto`,
  `GamePossessionPhoto`, `CharacterItemPhoto`, `GameDocumentPhoto`, `GameDocumentFilePhoto`,
  `StlModelPhoto`, `SourcePhoto`) are correctly registered, and `GamePhoto` is intentionally
  handled by `_DEFAULT_HANDLERS`.
- This is the **third** time this exact class of bug has occurred (it's also why `SourcePhoto`
  needed fixing in PR #1068), so beyond the immediate fix, this issue adds a guard test to catch
  a fourth recurrence at PR time instead of production.

## Expected Behavior

- Uploading a photo for a faction (`POST .../factions/<id>/photo_upload.json` then
  `PATCH /uploads/...`) successfully finalizes: the `FactionPhoto` is marked `ready`, and
  `faction.photo` is set to it, always replacing any existing photo.
- Uploading a photo for a collection similarly finalizes without error: the `CollectionPhoto` is
  marked `ready`. Promotion to `Collection.photo` continues to happen at upload-init time
  (unchanged, pre-existing gallery behavior) — finalize must not additionally re-promote a later
  gallery upload.
- Game possession photo upload continues to work exactly as it already does today
  (regression-checked, not changed).
- A new automated test fails immediately if a future `BasePhoto` subclass ships without a
  `_PHOTO_HANDLERS` entry (or an explicit allowlist exception), instead of only surfacing as a
  production crash.

## Solution

### Code changes

Add a `FactionPhoto` handler pair to `_PHOTO_HANDLERS` in `backend/uploads/views.py`, mirroring
the `GamePossessionPhoto` pattern (game-scoped permission, not the staff-only `Source`/`StlModel`
pattern — confirmed by the init endpoint `game_faction_photo_upload`, which checks
`EndpointPermission(..., game=game).check(request, 'game_faction', 'regular', 'photo_upload')`):

```python
def _set_faction_photo(faction_photo):
    """Set the faction's photo to `faction_photo`, always replacing any existing one."""
    faction = faction_photo.faction
    faction.photo = faction_photo
    faction.save()

def _faction_photo_permission(request, content_object):
    """Return a permission error Response for a FactionPhoto content object, else None."""
    game = content_object.faction.game
    return EndpointPermission(request.user, game=game).check(
        request, 'game_faction', 'regular', 'photo_upload',
    )
```

Plus importing `FactionPhoto` from `games.models` and registering
`FactionPhoto: (_faction_photo_permission, _set_faction_photo)` in `_PHOTO_HANDLERS`.

Add a matching `CollectionPhoto` handler pair. Its shape differs from faction's: the init
endpoint (`collection_photo_upload.py`) is `require_staff`-gated (like `Source`/`StlModel`, not
game-scoped), and a `Collection` is a **gallery** — multiple photos coexist, and only the
*first* upload is promoted to `Collection.photo`, which already happens at creation time in
`_create_photo`, not at finalize. So its `mark_ready` handler is a no-op, matching the existing
`_set_document_file_if_unset` no-op convention:

```python
def _collection_photo_permission(request, content_object):
    """Return a permission error Response for a CollectionPhoto content object, else None.

    `Collection` has no owning-game/ownership concept -- creation and photo upload are both
    uniformly staff-only, so the same `require_staff` gate used by the upload-init endpoint
    applies here too.
    """
    return require_staff(request)

def _set_collection_photo_if_unset(collection_photo):
    """No-op ready marker for CollectionPhoto: promotion to Collection.photo already happens
    at upload-init time (the first photo in the gallery), not at finalize.
    """
```

Plus importing `CollectionPhoto` from `miniatures.models` and registering
`CollectionPhoto: (_collection_photo_permission, _set_collection_photo_if_unset)` in
`_PHOTO_HANDLERS`.

**Scope:** fix is limited to registering `FactionPhoto` and `CollectionPhoto` in the finalize
handler registry. Game possessions need no code change — just a confirmation/regression check
that the existing finalize flow still works for `GamePossessionPhoto`.

### Regression guard

This is the **third** time a photo model has shipped without a `_PHOTO_HANDLERS` entry
(`FactionPhoto`, `CollectionPhoto`, and this exact class of bug is why `SourcePhoto` needed
fixing in PR #1068). Add a guard test so a fourth recurrence fails at PR time instead of
crashing in production:

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

Considered and rejected: eliminating the registry entirely (e.g. `permission_check`/`mark_ready`
as attributes on each model) — a bigger structural change that would reverse the deliberate,
recent move *to* an explicit registry (see the comment already in `views.py` noting it replaced
per-entity isinstance dispatch chains). The guard test gets the same safety without undoing that
design choice.

### Edge cases

Covered by the planned tests: faction's always-replace semantics on finalize, and collection's
finalize not re-promoting `Collection.photo` on a later gallery upload.

Considered and deemed out of scope:
- *Orphaned content object* — if a `Faction`/`Collection` were deleted between upload-init and
  finalize, the cascading `FactionPhoto`/`CollectionPhoto` delete would leave the `Upload`'s
  `content_object` resolving to `None`. None of the other existing handlers (item, treasure,
  possession) guard against this either, and there is no process in the product that actually
  deletes factions/collections, so this is a non-issue in practice.
- *Collection's "first-created-wins" promotion* — `_create_photo` promotes the first photo to
  `Collection.photo` at upload-**init** time (by creation order), not at finalize/ready time, so
  a later-finalizing upload could theoretically "win" the promotion race. Pre-existing design in
  `collection_photo_upload.py`, unrelated to the finalize bug being fixed here.

### Backward compatibility

No concerns. Since finalize crashes today for `FactionPhoto`/`CollectionPhoto`, there is no
existing correct behavior to preserve — the fix is purely additive (new registry entries, no
signature/response changes for anything already working). Any stray `FactionPhoto`/
`CollectionPhoto` rows left with `ready=False` from prior failed finalize attempts in production
are not addressed by this issue (no data cleanup/backfill needed).

### Performance & security

No performance concerns: the fix wires existing photo models into the existing finalize flow
with a single FK save each, the same shape as every other registered handler.

No security concerns: the current broken state fails closed rather than being a bypass —
`_DEFAULT_HANDLERS`' `_game_photo_permission` raises `AttributeError` on `content_object.game`
before granting access, so no faction/collection photo has ever reached `ready=True` via
finalize. The new permission checks mirror the init endpoints exactly
(`_faction_photo_permission` uses the same `game_faction`/`regular`/`photo_upload` check as
`game_faction_photo_upload`; `_collection_photo_permission` uses the same `require_staff` as
`collection_photo_upload`), so whoever can start an upload is exactly who can finish it.

### Testing strategy

**Init endpoints** (`game_faction_photo_upload`, `collection_photo_upload`): already fully
covered by the existing `backend/games/tests/views/games/game_faction_photo_upload_test.py` and
`backend/miniatures/tests/views/collection_photo_upload_test.py` respectively. No gap in either.

**Finalize endpoint, factions**: add a new `backend/uploads/tests/views_faction_test.py`,
mirroring the `GamePossessionPhoto` coverage in `backend/uploads/tests/views_test.py` (same
permission shape — game-scoped, `regular`/`photo_upload`) — following the existing per-entity
test file convention already used for the staff-only handlers (`views_source_test.py`,
`views_stl_model_test.py`):

- Setup: a `Faction` + `FactionPhoto`, plus separate uploads for DM, a player-of-game, and
  staff-not-owner
- `test_unauthenticated_request_returns_401_for_faction_upload`
- `test_unrelated_user_returns_403_for_faction_upload`
- `test_uploading_status_returns_200_for_faction_upload` (+ `file_path` in response)
- `test_uploaded_status_sets_faction_photo_ready`
- `test_uploaded_status_sets_game_faction_photo` (sets `faction.photo` when unset)
- `test_uploaded_status_replaces_existing_game_faction_photo` (always-replace, no "if unset"
  guard — matches `_set_faction_photo`)
- `test_uploading_status_returns_200_for_faction_upload_by_player_of_game`
- `test_uploaded_status_sets_faction_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_faction_upload_by_staff`
- `test_uploaded_status_sets_faction_photo_ready_for_staff`

**Finalize endpoint, collections**: add a new `backend/uploads/tests/views_collection_test.py`,
mirroring the staff-only pattern used by `views_source_test.py`/`views_stl_model_test.py`, plus
gallery-specific cases:

- Setup: a `Collection` with an existing (unset-photo) state, a superuser, a staff user, and a
  regular (non-staff) user
- `test_unauthenticated_request_returns_401_for_collection_upload`
- `test_non_staff_user_returns_403_for_collection_upload`
- `test_uploading_status_returns_200_for_collection_upload` (+ `file_path` in response)
- `test_uploaded_status_sets_collection_photo_ready`
- `test_uploaded_status_does_not_change_collection_photo_on_second_gallery_upload` (finalize
  must not re-promote a later gallery photo over the one set at init time)
- `test_staff_user_returns_200_for_collection_upload`
- `test_superuser_returns_200_for_collection_upload`

**Game possessions**: no new tests needed — `GamePossessionPhoto` finalize coverage already
exists in `backend/uploads/tests/views_test.py` and stays green as a regression check.

**Out of scope (tracked as a separate follow-up issue)**: `backend/uploads/tests/views_test.py`
is a 1549-line monolith covering nine entities in one shared `setUpTestData`/class. Splitting it
into one file per entity (matching the `views_source_test.py`/`views_stl_model_test.py`
convention) would improve readability, but is a separate refactor with its own risk (untangling
shared fixture state) — unrelated to this bug fix.

## Benefits

- Faction and collection photo uploads stop crashing with a 500 on finalize.
- Confirms game possession photo upload remains correctly implemented (no silent regression).
- A regression guard test prevents this exact bug class — a new photo model shipping without a
  `_PHOTO_HANDLERS` entry — from recurring a fourth time.
