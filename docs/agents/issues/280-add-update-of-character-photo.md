# Add update of character photo

## Context

A character's `profile_photo` is currently only set automatically the first time a photo finishes uploading (see `_set_profile_photo_if_unset` in `upload_finalize.py`). There is no way for a player, DM, or admin to change it afterwards to a different existing photo.

## What needs to be done

- Backend:
  - Add new PATCH endpoints, following the existing plural URL convention:
    - `games/<slug:game_slug>/pcs/<int:character_id>/photos/<int:photo_id>/set.json`
    - `games/<slug:game_slug>/npcs/<int:character_id>/photos/<int:photo_id>/set.json`
  - Reuse the existing `CharacterEditPermission` check (superuser, DM, or owning player) for authorization.
  - Accept a `roles` array in the payload; when it contains `"profile"`, set `character.profile_photo` to this photo. Other/unknown role values are ignored (reserved for future use). If `roles` does not include `"profile"`, the endpoint is a no-op and still returns success.
  - Add `profile_photo_id` to the character detail serializer (alongside the existing `profile_photo_path`) so the frontend can identify the current profile photo.
- Frontend:
  - Add a "Set as profile photo" button to `PhotoViewModal`, shown only for character photos and only to users who may edit that character (the character's owner, a DM of the game, or a superuser).
  - The button is disabled or hidden when the photo being viewed is already the character's profile photo.
  - Clicking the button sends a PATCH request for that specific photo with body `{"roles": ["profile"]}`.
  - On success, update local state so the character's profile photo reflects the change immediately.

## Acceptance criteria

- [ ] `PATCH games/<slug>/pcs/<id>/photos/<id>/set.json` and the npcs equivalent exist and are authorized via `CharacterEditPermission`.
- [ ] Sending `{"roles": ["profile"]}` sets `character.profile_photo` to the targeted photo, replacing any previously set photo.
- [ ] Sending a `roles` array without `"profile"` is a no-op and still returns a success response.
- [ ] The character detail serializer exposes `profile_photo_id` alongside `profile_photo_path`.
- [ ] `PhotoViewModal` shows a "Set as profile photo" button for character photos, only to users authorized to edit the character.
- [ ] The button is disabled or hidden when the displayed photo is already the character's profile photo.
- [ ] Clicking the button issues the PATCH request and updates the UI on success.

---
Tags: :shipit:
