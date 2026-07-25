# Backend Plan: Add set profile photo on characters page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `can_set_profile_photo` (bool) on `CharacterDetailSerializer`, computed via
`CharacterPhotoUploadPermission.is_allowed(user, character)`. Frontend consumes this field on the
character detail response in place of `can_edit` for "set as profile photo" gating.

## Implementation Steps

### Step 1 — Promote `CharacterPhotoUploadPermission`'s check to a public, reusable rule

In `backend/games/permissions.py`, rename `CharacterPhotoUploadPermission._is_allowed` to a
public `is_allowed` classmethod (same signature: `(cls, user, character)`), and update `check()`
to call `cls.is_allowed`. Update the class docstring to note it is now also the permission rule
for the "set as profile photo" action (not just upload), and that `is_allowed` is exposed
publicly because `CharacterDetailSerializer.get_can_set_profile_photo` needs the exact same rule
against a `request.user` that may be anonymous — mirror the precedent already set by
`CharacterMoneyEditPermission`'s docstring for the same reason.

### Step 2 — Widen the "set as profile photo" endpoint permission

In `backend/games/views/game/_photo_set.py`, replace the `CharacterEditPermission.check(request,
character)` call with `CharacterPhotoUploadPermission.check(request, character)`. This applies to
both the PC and NPC routes (`PATCH /games/<slug>/pcs/<id>/photos/<photo_id>/set.json` and the NPC
equivalent), since both share `character_photo_set` in this file.

### Step 3 — Expose `can_set_profile_photo` on the character detail serializer

In `backend/games/serializers/characters/character_detail.py`:
- Import `CharacterPhotoUploadPermission` alongside the existing permission imports.
- Add `can_set_profile_photo = serializers.SerializerMethodField()`.
- Add `'can_set_profile_photo'` to `Meta.fields`, near `can_edit`/`can_edit_money`.
- Add `get_can_set_profile_photo(self, obj)`, following the exact pattern of
  `get_can_edit_money`/`get_can_exchange_treasure`: resolve `request.user` from context, return
  `CharacterPhotoUploadPermission.is_allowed(user, obj)`.

### Step 4 — Update access-control docs

- `docs/agents/access-control/character-photo.md`: update the "Write access" bullet for the "set
  as profile photo" endpoints to state the widened permission (superuser, DM, owning player for a
  PC, any player of the game, any Staff account), replacing the current
  `CharacterEditPermission`-only description.
- `docs/agents/access-control/character.md`: add `can_set_profile_photo` to the "Detail" section's
  field list and give it a short paragraph mirroring the existing `can_edit_money` paragraph
  (computed from the requester's identity, gates the show page's "set as profile photo" button,
  distinct from `can_edit`).
- `docs/agents/access-control/common-rules.md` (or wherever `CharacterPhotoUploadPermission` is
  described as a shared pattern, if at all): note it is now used for both photo upload and
  photo-set actions.

### Step 5 — Tests

- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_set_test.py` and the NPC
  equivalent (`.../npcs/detail/photos/game_npc_photo_set_test.py`): update/extend permission
  assertions so a plain player of the game and a global Staff account (not otherwise DM/owner) are
  now allowed (200), matching `CharacterPhotoUploadPermission`'s existing test coverage in the
  photo-upload test files (`backend/games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py`,
  `.../npcs/detail/game_npc_photo_upload_test.py`) for the same role matrix. Keep the existing
  "unauthenticated → 401" and "unrelated user → 403" cases.
- `backend/games/tests/serializers/characters/character_detail_test.py`: add cases for
  `can_set_profile_photo`, mirroring the existing `can_edit_money`/`can_exchange_treasure` test
  cases (allowed for owner/DM/superuser/staff/any player of the game; denied for an unrelated
  authenticated user and for anonymous).
- If `permissions_test.py` (`backend/games/tests/permissions_test.py`) unit-tests
  `CharacterPhotoUploadPermission` directly, confirm its existing cases still pass unchanged after
  the `_is_allowed` → `is_allowed` rename (no behavior change, only visibility).

## Files to Change

- `backend/games/permissions.py` — promote `CharacterPhotoUploadPermission._is_allowed` to public
  `is_allowed`.
- `backend/games/views/game/_photo_set.py` — swap `CharacterEditPermission` for
  `CharacterPhotoUploadPermission`.
- `backend/games/serializers/characters/character_detail.py` — add `can_set_profile_photo` field.
- `docs/agents/access-control/character-photo.md` — update write-access description.
- `docs/agents/access-control/character.md` — document the new field.
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_set_test.py` — widen permission
  test cases.
- `backend/games/tests/views/game/npcs/detail/photos/game_npc_photo_set_test.py` — widen
  permission test cases.
- `backend/games/tests/serializers/characters/character_detail_test.py` — add
  `can_set_profile_photo` cases.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`,
  `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes

- `CharacterPhotoUploadPermission`'s docstring currently says it "must not be reused for general
  character editing" — reusing it for "set as profile photo" is consistent with that constraint,
  since setting a profile photo is a photo action, not a general character edit.
- NPCs have no owner concept; `CharacterPhotoUploadPermission.is_allowed` already handles this
  correctly since `character.can_be_edited_by(user)` and `game.has_player(user)` both work
  identically for PCs and NPCs, with no PC-only branch to worry about (unlike
  `CharacterMoneyEditPermission`).
