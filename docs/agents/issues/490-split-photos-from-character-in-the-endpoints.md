# Issue: Split photos from character in the endpoints

## Description
In `/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/pcs/:id/edit`, `/#/games/:game_slug/npcs/:id`, and `/#/games/:game_slug/npcs/:id/edit`, the frontend loads either `/games/:game_slug/(n)pcs/:id.json` or `/games/:game_slug/(n)pcs/:id/full.json`, both of which currently embed the character's full `photos` list inline (via `CharacterDetailSerializer`, inherited by `CharacterFullSerializer`).

A dedicated `/games/:game_slug/pcs/:id/photos.json` endpoint already exists, and so does its NPC equivalent `/games/:game_slug/npcs/:id/photos.json` (`backend/games/views/characters/game_npc_photos.py`) — both already wired into the frontend's separate photo-gallery page. The index/list serializers (`CharacterListSerializer`, `CharacterFullListSerializer`) do not include `photos` today, so no change is needed there.

## Problem
The character detail and full endpoints duplicate photo data that is already available from the dedicated photos endpoints, making PC/NPC show and full payloads heavier than necessary and keeping photo data in two places.

## Expected Behavior
- PC and NPC show (`.json`) and full (`full.json`) endpoints no longer include an embedded `photos` field.
- `profile_photo_path` and `profile_photo_id` remain unchanged on all serializers.
- The show and edit pages for PCs and NPCs still display the same photo preview grid (capped at `MAX_PREVIEW_PHOTOS` = 6), now backed by a request to the existing `photos.json` endpoint instead of the embedded field, fetched eagerly alongside `full.json` as part of the same character load.

## Solution
**Backend**
- Remove the `photos` field from `CharacterDetailSerializer` (`backend/games/serializers/character_detail.py`); `CharacterFullSerializer` inherits this automatically.
- No endpoint work needed — both PC and NPC `photos.json` endpoints already exist and are equivalent.

**Frontend**
- Update the character loading flow (`CharacterController.loadCharacter` and the shared edit controller) to also eagerly fetch `photos.json` — same timing as the existing `full.json` fetch — requesting `per_page=6` (matching the existing `MAX_PREVIEW_PHOTOS` constant in `characterPreviewConstants.js`) instead of fetching all photos and slicing client-side.
- Merge the fetched photos into character state so `CharacterPhotosPreviewHelper.jsx` keeps rendering the same preview grid, without needing its own client-side slice anymore.

## Benefits
Smaller PC/NPC show and full payloads, a single source of truth for photo data instead of duplicating it across endpoints, and a right-sized photos request for the preview grid instead of over-fetching and slicing client-side.
