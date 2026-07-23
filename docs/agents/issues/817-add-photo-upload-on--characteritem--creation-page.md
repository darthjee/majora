# Issue: Add photo upload on `CharacterItem` Creation page

## Problem
When creating a `CharacterItem`, the creation form (`CharacterItemNew.jsx`) has no photo/left column at all today. The `CharacterItem` create endpoint already creates the underlying `GameItem`, and its response already includes the `GameItem` id (`game_item_id`). Users must first create the item, then separately navigate to the `GameItem` page to upload a photo — even though the photo-upload endpoint (`POST /games/:game_slug/items/:id/photo_upload`) could already be called right after creation.

A `CharacterItem` without its own photo already falls back to showing its `GameItem`'s photo, so uploading the `GameItem`'s photo at creation time covers both cases in a single flow, matching the deferred-upload pattern already shipped for NPC creation (`/#/games/:game_slug/npcs/new`).

## Solution
- Add a left-side photo slot to the shared `CharacterItemNew.jsx` creation form (used by both `/#/games/:game_slug/pcs/:id/items/new` and `/#/games/:game_slug/npcs/:id/items/new`), styled like the item's existing photo look (the `ActionsOverlay`-based placeholder already used by `ItemPhoto`'s `Show`/`Edit` variants), adding a new `New` variant for it.
- Reuse `PhotoUploadModal` in `deferred` mode so the user can pick a file before submit, holding it in local state — the same mechanism `GameNpcNew.jsx` already uses.
- Extract the create-then-upload saga currently inlined in `GameNpcNewController` (`#uploadPhoto`, `#handleResponse`, `#failPhotoUpload`, `retryPhotoUpload`) into a shared/reusable controller helper, and have both `GameNpcNewController` and `CharacterItemNewController` use it — instead of duplicating the logic.
- On submit:
  1. Create the `CharacterItem` via `CharacterClient.createItem` (unchanged) — the response already includes `game_item_id`.
  2. If a photo was picked, upload it against the returned `game_item_id` using the existing two-step `UploadClient` flow (`initUpload` then `submitUpload`) against `POST /games/:game_slug/items/:game_item_id/photo_upload.json`, via the shared helper above.
  3. On upload failure, stay on the creation page (the `CharacterItem`/`GameItem` already exist) and show an inline retry/skip alert, mirroring `NpcNewPhotoUploadFailedAlert` but without a redirect, since there is no per-item detail page to land on yet. "Skip" proceeds to the same destination as a normal successful creation (the items list).
- No backend changes are needed: the `photo_upload` endpoint and the `game_item_id` field on the creation response already exist.

## Benefits
- Removes the extra manual trip to the `GameItem` page just to add a photo.
- Reuses the same deferred-upload UX pattern already shipped for NPC creation, keeping the two flows consistent.
- Consolidates the create-then-upload saga into one shared implementation instead of two diverging copies.
