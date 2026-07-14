# Issue: Add mark as profile action bar for character photos

## Description
On the character photos gallery page, photos are listed but there is no quick way to mark one of them as the character's profile picture without opening each photo individually.

## Problem
A "set as profile photo" action already exists, but it is buried inside the photo lightbox modal (opened by clicking a photo card). There is no inline, at-a-glance way to do it directly from the gallery grid, unlike the slain/revive action bar already used on the NPCs list page.

## Expected Behavior
On the `/#/games/:game_slug/pcs/:id/photos` and `/#/games/:game_slug/npcs/:id/photos` gallery pages, hovering a photo card reveals an action bar (same pattern as `/#/games/:game_slug/npcs`) with a button using the bootstrap `postage` icon. Clicking it marks that photo as the character's profile photo, visible only to users who may edit the character, and hidden for the photo that is already the profile photo.

## Solution
- Add a `postage` entry to `frontend/assets/js/utils/ui/Icons.js` (e.g. `bi-postage-fill`)
- Extend `PhotoCard`/`PhotoCardHelper` to render an `ActionsOverlay`/`ActionBar` on hover (same pattern as the NPCs list), with a single "mark as profile" secondary button gated on `canSetProfilePhoto` and hidden when the photo is already the profile photo
- Wire the button to the existing `BaseCharacterPhotosController#setProfilePhoto` / `CharacterClient#setPhotoRoles` call, already backed by the existing `PATCH /games/:game_slug/pcs|npcs/:id/photos/:photo_id/set.json` endpoint (`{"roles": ["profile"]}`)
- No backend changes needed: that endpoint already validates the photo belongs to the character and is gated by `CharacterEditPermission` (admin, dm, or the character's owner) -- exactly the intended access rule
- The existing lightbox-modal button stays as-is; this adds a faster inline path, it does not replace anything

## Benefits
- Faster, more discoverable way to set a profile photo, consistent with the existing NPCs list action-bar UX
- Reuses the already-implemented, already-permissioned backend endpoint instead of duplicating profile-photo-setting logic elsewhere
