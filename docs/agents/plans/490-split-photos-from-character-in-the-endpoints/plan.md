# Plan: Split photos from character in the endpoints

Issue: [490-split-photos-from-character-in-the-endpoints.md](../issues/490-split-photos-from-character-in-the-endpoints.md)

## Overview

Stop embedding the character's full `photos` list in the PC/NPC show (`.json`) and full (`full.json`) responses, since a dedicated `/games/:game_slug/{pcs,npcs}/:id/photos.json` endpoint already exists for both kinds. The backend agent removes the `photos` field from `CharacterDetailSerializer` (inherited by `CharacterFullSerializer`). The frontend agent adds a small, explicitly-paginated fetch of `photos.json` to the character load flow so the existing photo preview grid on the show page keeps working, unchanged in appearance.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Removed field**: `photos` disappears from the JSON body of `GET /games/:game_slug/pcs/:id.json`, `GET /games/:game_slug/npcs/:id.json`, `GET /games/:game_slug/pcs/:id/full.json`, and `GET /games/:game_slug/npcs/:id/full.json`. No other field changes shape — `profile_photo_path` and `profile_photo_id` are untouched, and index/list endpoints already never had a `photos` field.
- **Replacement source**: the frontend must fetch photo data from the already-existing `GET /games/:game_slug/{pcs,npcs}/:id/photos.json` endpoint instead. Its response shape is unchanged by this issue: a paginated list of `{id, path}` objects (`CharacterPhotoSerializer`), with `page`/`pages`/`per_page` pagination headers.
- **Page size for the preview**: the frontend requests `per_page=6` (matching the existing `MAX_PREVIEW_PHOTOS` constant in `frontend/assets/js/components/common/characterPreviewConstants.js`) on this new fetch, so the preview grid no longer needs to over-fetch and slice client-side.
- **Sequencing**: the two agents' work is independent and can proceed in parallel — the photos endpoints backing `photos.json` already exist today, so the frontend change does not depend on the backend serializer change landing first (or vice versa).
