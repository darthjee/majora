# Plan: Enhance Upload Photo Endpoints

Issue: [274-enhance-upload-photo-endpoints.md](../issues/274-enhance-upload-photo-endpoints.md)

## Overview
Rename the ambiguous `id` key in the three photo-upload init responses (game, PC, NPC) to `upload_id`, and add the id of the entity the upload belongs to (`game_id` or `character_id`). Update the frontend controller that consumes this response, and update the access-control doc to match.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

All three photo-upload init endpoints change their JSON response shape:

- `POST /games/<slug>/photo_upload.json` — was `{"id": <int>, "token": "<str>"}`, becomes `{"upload_id": <int>, "token": "<str>", "game_id": <int>}`.
- `POST /games/<slug>/pcs/<id>/photo_upload.json` and `POST /games/<slug>/npcs/<id>/photo_upload.json` — was `{"id": <int>, "token": "<str>"}`, becomes `{"upload_id": <int>, "token": "<str>", "character_id": <int>}`.

`token`'s meaning and the subsequent submit-upload call are unchanged. The frontend must read `upload_id` (not `id`) when calling `submitUpload`; `game_id`/`character_id` are not currently consumed by any caller.
