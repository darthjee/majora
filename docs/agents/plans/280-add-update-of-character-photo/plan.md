# Plan: Add update of character photo

Issue: [280-add-update-of-character-photo.md](../../issues/280-add-update-of-character-photo.md)

## Overview

Add a PATCH endpoint (for both PCs and NPCs) that lets an authorized editor of a character mark
one of that character's existing photos as the character's profile photo. Expose the current
profile photo's id on the character detail serializer so the frontend can tell which photo is
currently selected, then add a "Set as profile photo" button to the photo lightbox
(`PhotoViewModal`) that calls the new endpoint.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- New endpoints, following the existing plural URL convention used by photo-related routes:
  - `PATCH games/<slug:game_slug>/pcs/<int:character_id>/photos/<int:photo_id>/set.json`
  - `PATCH games/<slug:game_slug>/npcs/<int:character_id>/photos/<int:photo_id>/set.json`
  - Request body: `{"roles": ["profile"]}` (array of strings). Only `"profile"` is recognized
    today; any other/unknown values are ignored (reserved for future use). If the array does
    not contain `"profile"`, the endpoint is a no-op and still returns `200`.
  - On success (`"profile"` present): sets `character.profile_photo` to the targeted
    `CharacterPhoto`, replacing whichever photo was previously set (unconditionally, not only
    when unset — unlike `_set_profile_photo_if_unset`). Returns `200` with an empty body.
  - Authorization: reuse `CharacterEditPermission.check` (superuser, DM of the game, or the
    character's owning player) exactly as `upload_finalize`/`character_photo_upload` do. Returns
    `401` when unauthenticated, `403` when authenticated but not allowed to edit the character,
    and `404` when the game/character/photo does not exist or the photo does not belong to that
    character.
- `CharacterDetailSerializer` (`source/games/serializers/character_detail.py`) gains a new
  read-only field `profile_photo_id` (integer, `null` when unset), alongside the existing
  `profile_photo_path`, sourced from `profile_photo.id` with `default=None`. This is what the
  frontend compares each photo's `id` against to know whether it is already the profile photo.
  Frontend already receives the full character object (via `CharacterClient.fetchPc`/`fetchNpc`)
  on the character photos pages, so no new fetch is required.

## Implementation Steps (cross-cutting order)

1. `backend` implements the endpoints, serializer field, and tests first (see
   [backend.md](backend.md)).
2. `frontend` adds the button and wiring once the contract above is available (see
   [frontend.md](frontend.md)) — frontend work can be written/reviewed in parallel with backend
   since the contract is fixed above, but relies on the backend endpoint existing before the
   integration can be exercised end-to-end.

## Files to Change

See the per-agent files ([backend.md](backend.md), [frontend.md](frontend.md)) for the exact
file lists.

## CI Checks

- `source`: `docker-compose run majora_app poetry run pytest games/tests/views/` (CI job:
  `pytest_views`) and `docker-compose run majora_app poetry run ruff check .` (CI job: `checks`)
- `frontend`: `docker-compose run majora_fe npm run coverage` (CI job: `jasmine`) and
  `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- This is the same shape of feature as the existing "cover photo" (`Game.cover_photo`) and
  "treasure photo" (`Treasure.photo`) set-on-upload logic, but exposed as an explicit,
  user-triggered PATCH rather than an automatic upload-completion side effect — no changes to
  `upload_finalize.py` are needed.
- `data-access` review is warranted once backend lands: new endpoint + new serializer field.
- `security` review is warranted once backend lands: new endpoint accepting user input
  (`roles` array) with authorization logic.
