# Plan: Add treasure photos

Issue: [276-add-treasure-photos.md](../issues/276-add-treasure-photos.md)

## Overview

Add a single-photo-per-treasure model (`TreasurePhoto`) mirroring the existing
`GamePhoto`/`CharacterPhoto` pattern, but always reusing/updating the one photo row
instead of creating a new one on every upload. A new superuser-only
`photo_upload.json` endpoint is added for treasures, the existing generic
submit/finalize lifecycle is extended to recognize `TreasurePhoto`, and
`photo_path` is exposed on the treasure serializers. On the frontend, both
treasure index pages (`Treasures.jsx` and `GameTreasures.jsx`, via
`TreasureCard`/`TreasureCardHelper`) get a superuser-only upload button wired
to the existing `PhotoUploadModal`, and `CardTreasureImage` renders the photo
when present.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **New endpoint**: `POST /treasures/<int:treasure_id>/photo_upload.json`
  (superuser-only, matching `Treasure.can_be_edited_by`). Request body:
  `{"filename": "<original file name>"}` (same shape validated today by
  `PhotoUploadSerializer`, consumed via `UploadClient.initUpload(path, filename, token)`).
  Response (201): `{"upload_id": <int>, "token": "<string>", "treasure_id": <int>}` —
  matches the response convention from issue #274 used by the game/character
  upload-init endpoints.
- **Existing reused endpoints** (no contract change, just a new accepted
  content-object type): `POST /uploads/<id>/submit` and
  `PATCH /uploads/<id>.json` (`upload_finalize`).
- **New read field**: `Treasure`'s list and detail serializers gain
  `photo_path` — `CharField(source='photo.path', default=None, read_only=True)`,
  i.e. `null` when the treasure has no photo yet, otherwise a string path
  (e.g. `"photos/treasures/12/photo.png"`). This is what the frontend reads to
  decide whether to render the real photo or the `default_treasure.png`
  placeholder.
- **Button visibility**: gated client-side on the existing global `isSuperUser`
  flag (the same one already read via `AdminAccess.isSuperUser()` /
  `HeaderController`'s status check for the admin nav link, issue #264) — not
  a per-treasure `can_edit` check, since only superusers may ever edit a
  treasure.

## CI Checks

- `source`: `poetry run pytest games/tests/` (CI job: `pytest_views` / `pytest_all`), `poetry run ruff check .` (CI job: `checks`)
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`), `npm run lint` (CI job: `frontend-checks`)
