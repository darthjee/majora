# Issue: Remove old photos urls

## Description
Remove the legacy `Game.photo` and `Character.avatar_url` URL fields now that both entities have a proper in-app photo upload mechanism: `GamePhoto`/`cover_photo_path` (issue #254) and `CharacterPhoto`/`profile_photo_path` (issue #255). The frontend is updated to rely solely on the uploaded photos instead of falling back to these legacy fields.

## Problem
Games and characters still carry the original manually-entered external URL fields (`Game.photo`, `Character.avatar_url`), which the backend still serializes and the frontend still falls back to when no uploaded photo exists. The game creation form still exposes a plain-text "photo URL" input, and character edit pages still expose a plain-text "avatar URL" input alongside the newer upload flow. Keeping both mechanisms around is redundant now that uploads are fully supported.

## Expected Behavior
- `Game.photo` and `Character.avatar_url` no longer exist on the models, are not part of any serializer, and are not returned by any API endpoint.
- The frontend no longer falls back to these fields; game cards/detail pages render `cover_photo_path` and character cards/detail pages render `profile_photo_path` only (or a placeholder/blank state when no photo has been uploaded yet).
- The game creation form no longer has a "photo URL" text input. A cover photo is set afterward via the game edit page, which already supports upload.
- Character edit pages (PC/NPC) no longer show the "avatar URL" text field; the photo is set only via the existing upload modal.

## Solution
- Backend: drop `Game.photo` and `Character.avatar_url` via a new migration (e.g. `0028_...`), depending on the latest `0027_characterphoto_character_profile_photo_delete_photo`.
- Remove `photo`/`avatar_url` from the affected serializers: `GameDetailSerializer`, `GameUpdateSerializer`, `GameCreateSerializer`, `CharacterListSerializer`, `CharacterDetailSerializer`, `CharacterUpdateSerializer`/`CharacterFullSerializer`.
- Frontend: remove the legacy-field fallback logic in `GameCardHelper.jsx`, `GameHelper.jsx`, `CharacterCardHelper.jsx`, and `CharacterHelper.jsx`, rendering `cover_photo_path`/`profile_photo_path` directly.
- Remove the `photo` text input and its wiring from `GameNewHelper.jsx`/`GameNewController.js` and from `GameEditHelper.jsx`/`GameEditController.js` (the edit page keeps only its existing upload button).
- Remove the `avatar_url` text field and its wiring from `BaseCharacterEditHelper.jsx`/`BaseCharacterEditController.js` and `CharacterEdit.jsx` (keep only the existing upload flow).
- Update `docs/agents/access-control.md` to remove `photo`/`avatar_url` as exposed/write fields and drop the "legacy fallback" language for `cover_photo_path`/`profile_photo_path`.

## Benefits
- Simplifies models, serializers, and frontend helpers by removing dead fallback paths.
- Forces all game/character photos through the vetted in-app upload pipeline (with its `ready` lifecycle), removing reliance on externally hosted, unvalidated URLs.
- Reduces UI clutter by removing duplicate photo-input mechanisms (URL field alongside upload button).
