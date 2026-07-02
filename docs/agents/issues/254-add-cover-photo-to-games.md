# Issue: Add cover photo to games

## Description
Games should have a designated cover photo, automatically set from the first `GamePhoto` upload that finishes processing for that game. The cover photo's path is exposed via the API as `cover_photo_path`, and the frontend prefers it over the legacy `game.photo` field when present. As part of this, the unused `GamePhoto.url` field is removed.

## Problem
`Game` currently has no relation to `GamePhoto` — only a legacy `photo` field (a plain URL, unrelated to the upload system) — and there is no concept of a cover photo anywhere in the codebase. Separately, `GamePhoto.url` is exposed by `GamePhotoSerializer` but nothing in the production upload flow ever sets it (only `GamePhoto.path`, a relative storage key, is populated) — it's dead/outdated.

## Expected Behavior
- When a photo upload for a game finishes processing (the backend transitions the upload's status to uploaded, in `PATCH /uploads/:id.json` — see `_mark_content_object_ready` in `source/games/views/upload_finalize.py`, reached via the proxy's `POST /uploads/:id/submit`), the game's `cover_photo` is set to that photo, but only if the game does not already have a `cover_photo`. No backfill for existing games is needed — this only applies going forward.
- If the `GamePhoto` set as a game's `cover_photo` is later deleted, `Game.cover_photo` is set back to null (`SET_NULL`) rather than blocking the deletion.
- The Game API (list and detail) exposes `cover_photo_path`, equal to `game.cover_photo.path` (the raw relative path as stored, unmodified) when a cover photo is set, or null/absent otherwise.
- In the frontend, wherever `game.photo` is currently rendered as the display image (game list card and game detail page, both via the shared `CardPhoto` component), `cover_photo_path` is used instead when present, falling back to `game.photo`. The `game.photo` field itself is untouched otherwise (e.g. still used as-is in the game edit form).

## Solution
- Add a nullable FK field `cover_photo` (column `cover_photo_id`, `on_delete=SET_NULL`) on `Game`, pointing to `GamePhoto`.
- In `_mark_content_object_ready` (`source/games/views/upload_finalize.py`), after marking the `GamePhoto` as ready, also set `game.cover_photo` to that photo when `game.cover_photo_id` is currently `None`, then save the game.
- Remove the `GamePhoto.url` field (migration), and its references in `GamePhotoSerializer` (`source/games/serializers/game_photo.py`) and the related tests (`test_game_photo.py`, `serializers/test_game_photo.py`, `serializers/test_game_detail.py`).
- Add a read-only `cover_photo_path` field to `GameListSerializer` and `GameDetailSerializer` (`source/games/serializers/game_list.py`, `game_detail.py`), returning `game.cover_photo.path` when set, else null.
- In the frontend, update the `url` prop passed to `CardPhoto` in `GameCardHelper.jsx` and `GameHelper.jsx` to `game.cover_photo_path || game.photo`.

## Benefits
Games automatically get a representative cover photo as soon as one is uploaded, without requiring manual curation, and the outdated/unused `GamePhoto.url` field is cleaned up along the way.

---

Tags: :shipit:
