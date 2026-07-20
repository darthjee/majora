# Issue: PC show page should show up to 11 photos

## Description
On the PC and NPC show pages, at the bottom, there is a list of character photos (shared implementation, parameterized by `characterKind`).

This is currently hardcoded to fetch and display up to 6 photos.

## Problem
The photo list is capped at 6 in two places, which limits how many photos of a character can be shown even when more are available:
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js:16` — `MAX_PREVIEW_PHOTOS = 6`, used by `CharacterPhotosPreviewHelper.jsx` to slice the fetched list for display.
- `frontend/assets/js/client/CharacterClient.js:123` — `fetchCharacterPhotos(..., perPage = 6)`, the default page size used for the actual API request (`?per_page=6`).

The backend itself has no cap on `per_page` (`backend/games/paginator.py`), so 6 is purely a frontend constant/default.

## Expected Behavior
The PC and NPC show pages fetch and display up to 11 photos instead of 6. With 11 photos, the preview fits in 2 rows (including the "see more" button) using the existing layout — no layout redesign needed, this is the intended look.

## Solution
- Raise `MAX_PREVIEW_PHOTOS` from 6 to 11 in `characterPreviewConstants.js`.
- Raise the default `perPage` from 6 to 11 in `CharacterClient.fetchCharacterPhotos` (`frontend/assets/js/client/CharacterClient.js:123`), so the preview fetch itself requests 11 instead of over-fetching and slicing.
- In `.circleci/navi_config.yaml`, add new `short_pc_photos`/`short_npc_photos` cache-warm entries at `?per_page=11`, mirroring the existing `short_pc_treasures`/`short_pc_items` pattern (lines ~277-278, ~305-306) that warms the preview-sized fetch. Today no such photo-specific short entry exists — the existing `pc_photos`/`npc_photos` entries (lines ~249-262, ~334-347) warm the full paginated list at the default page size (24) and are unrelated to this preview cap.

## Benefits
Characters with more than 6 photos get a fuller preview on their show page, consistent with the treasures/items preview pattern, without any backend or layout changes.
