# Plan: Add photos to characters

Issue: [255-add-photos-to-characters.md](../../issues/255-add-photos-to-characters.md)

## Overview

Mirror the `GamePhoto` / `Game.cover_photo` pattern introduced in issue #254, but for
`Character`. A new `CharacterPhoto` model replaces the legacy, upload-less `Photo` model,
serving both the character's photo gallery (`character.photos`) and, via a new
`Character.profile_photo` FK, the character's profile picture. The first `CharacterPhoto`
uploaded for a character is automatically set as its profile photo. The frontend prefers the
computed `profile_photo_path` over `avatar_url` wherever a character's image is rendered,
exactly the same precedence rule already used for `cover_photo_path` vs `Game.photo`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **New model `CharacterPhoto`** (`games` app), mirroring `GamePhoto`: `character` (FK to
  `Character`, `on_delete=CASCADE`, `related_name='photos'`), `path` (`CharField`,
  `max_length=512`, `blank=True`, `default=''`), `ready` (`BooleanField`, `default=False`).
  Replaces the legacy `Photo` model (`url`, `character` FK), which is removed entirely.

- **New field `Character.profile_photo`** — nullable FK to `CharacterPhoto`,
  `on_delete=models.SET_NULL`, `related_name='+'` (same shape as `Game.cover_photo`).

- **New serializer field `profile_photo_path`** — `serializers.CharField(source='profile_photo.path', default=None, read_only=True)`, added to `CharacterListSerializer` and
  `CharacterDetailSerializer` (and therefore inherited by `CharacterFullSerializer`). Value is
  the raw relative storage path of the character's profile photo, or `null` when unset — same
  shape as `Game.cover_photo_path`. Returned by `GET /games/<slug>/pcs.json`,
  `GET /games/<slug>/npcs.json`, `GET /games/<slug>/pcs/<id>.json`,
  `GET /games/<slug>/npcs/<id>.json`, and the `/full.json` variants.

- **New character photo upload-init endpoints**:
  - `POST /games/<slug>/pcs/<id>/photo_upload.json`
  - `POST /games/<slug>/npcs/<id>/photo_upload.json`

  Same request/response contract as the existing `POST /games/<slug>/photo_upload.json`:
  body `{"filename": "<name>"}`, 201 response `{"id": <upload_id>, "token": "<upload_token>"}`.
  Permission is `CharacterEditPermission` (the character's linked player, any GameMaster of
  the character's game, or a superuser) instead of `GameEditPermission`.

- **Existing endpoint `PATCH /uploads/<id>.json` is generalized** to also handle
  `CharacterPhoto`-backed uploads (it already handles `GamePhoto`-backed ones): permission
  checks dispatch on the upload's `content_object` type (`GameEditPermission` for
  `GamePhoto`, `CharacterEditPermission` for `CharacterPhoto`), and marking the upload
  `uploaded` sets `character.profile_photo` the same way it already sets `game.cover_photo` —
  only if not already set.

- **`CharacterPhotoSerializer`** (replaces `PhotoSerializer`) exposes only `id` — no `url` —
  same shape as `GamePhotoSerializer` post-#254. The frontend `CharacterPhotos` gallery
  component already tolerates photo objects without a `url` field (this is a pre-existing
  condition carried over unchanged from `GamePhoto`/issue #254 — not something this issue
  needs to fix).

- **Frontend precedence rule**: wherever a character's image is rendered as the primary
  photo, use `character.profile_photo_path || character.avatar_url` (same pattern as
  `game.cover_photo_path || game.photo`). This applies to `CharacterCardHelper.jsx` (via
  `CardAvatar`) and `CharacterHelper.jsx` (via `CardAvatar`).

- **No frontend upload UI is wired in this issue.** Issue #254 added the `GamePhoto`
  upload-init endpoint and cover-photo-on-first-upload behavior without wiring a new upload
  trigger either (`PhotoUploadModal`/`GameEdit.jsx` already pre-existed that issue). This
  issue follows the same precedent: the backend endpoint is added and functional, but no new
  frontend component calls it yet. That is out of scope here.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views`,
  `pytest_all`) and `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`) and
  `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- `docs/agents/access-control.md` must be updated in the same PR: remove/replace the
  `## Photo` section with a `## CharacterPhoto` section mirroring the existing `## GamePhoto`
  section, and update the `## Character` section's exposed-fields rows to include
  `profile_photo_path`, and add the new upload-init endpoint to the access table (mirroring
  the existing `## Photo upload init endpoint` section). This is architect/docs work, done
  after backend lands, not delegated to either specialist plan file.
- The `data-access` review agent must be invoked after backend changes land, since this issue
  adds new endpoints and new serializer fields (`profile_photo_path`, new upload-init routes).
