# Issue: Add set profile photo on characters page

## Description
On a character's photos sub-page (`/#/games/pcs/:id/photos`, `/#/games/npcs/:id/photos`), each
photo card already has a hover action button (icon `bi-postage-fill`) to mark that photo as the
character's profile photo (see `PhotoCardHelper.jsx`, wired from `CharacterPhotos.jsx`). The
character show page (`/#/games/pcs/:id`, `/#/games/npcs/:id`) has its own photo preview grid but
does not expose this action directly on the grid — only indirectly, via the lightbox modal opened
by clicking a photo, which already has a working "set as profile photo" button. This issue adds
the same hover action button to the show page's photo preview grid, and reconciles the permission
rules around uploading a character photo vs. setting one as the profile photo, which are
currently inconsistent.

## Problems
- The "set as profile photo" endpoints (`PATCH /games/<slug>/pcs|npcs/<id>/photos/<photo_id>/set.json`)
  are gated by `CharacterEditPermission`: only a superuser, the game's GameMaster (DM), or (for a
  PC) its owning player.
- The character photo upload endpoints/buttons are gated by the broader
  `CharacterPhotoUploadPermission`, which additionally allows any player of the game and any
  global Staff account.
- This asymmetry means a user who is allowed to upload a character photo may not be allowed to
  set it as the profile photo, which is inconsistent and confusing.
- The character show page's photo preview grid (`CharacterPhotosPreviewHelper.jsx`'s
  `#renderCard`) renders plain `CardPhoto` cards with no action bar, unlike the photos sub-page,
  so there is no direct "set as profile photo" affordance on the show page's grid today (only via
  the lightbox modal).

## Expected Behavior
- On the character show page, each photo in the preview grid shows a hover action button (icon
  `bi-postage-fill`) to set that photo as the profile photo, mirroring the photos sub-page's
  mechanic — hidden when the photo is already the profile photo, or when the current user lacks
  permission.
- Clicking the button sets that photo as the profile photo and reloads the character's
  information on the page (same reload behavior already used by the photos sub-page and the
  show page's lightbox modal).
- The existing lightbox modal action stays as an additional path to the same result.
- The "set as profile photo" endpoints allow the same roles as the photo upload endpoints:
  superuser, GameMaster (DM) of the game, the PC's own owning player, any player of the game, and
  any global Staff account. For NPCs, the same list applies minus the owner case, since an NPC has
  no owning player.

## Solution
### Reorganize permissions
- Widen the "set as profile photo" permission check (currently `CharacterEditPermission` in
  `backend/games/views/game/_photo_set.py`) to match `CharacterPhotoUploadPermission` — the same
  permission class already used by the photo upload endpoints — for both the PC and NPC routes.
- Update `docs/agents/access-control/character-photo.md` (and any other affected access-control
  doc) to reflect the widened permission and remove the asymmetry with the upload endpoints.

### Add the set-photo-as-profile action to the show page
- Extend `CharacterPhotosPreviewHelper.jsx`'s `#renderCard` (used by the show page's photo
  preview grid) to render photos through `PhotoCard`/`PhotoCardHelper` instead of a bare
  `CardPhoto`, passing `canSetProfilePhoto`, `isProfilePhoto`, and `onSetProfilePhoto` — the same
  props the photos sub-page already passes.
- Reuse the existing `handleSetProfilePhoto` wiring already present in `CharacterDetail.jsx`
  (calls `controller.setProfilePhoto(...)` then `controller.buildEffect()()` to reload the
  character), rather than introducing a new mechanism.
- Ensure the frontend gate for `canSetProfilePhoto` reflects the widened backend permission
  (reusing an existing flag if it already covers the same role set, or introducing a dedicated
  one, following the precedent set by `can_edit_money`/`can_exchange_treasure`).

## Benefits
- Consistent permission model: any user allowed to upload a character photo is also allowed to
  set it as the profile photo, for both PCs and NPCs.
- Faster UX: the profile photo can be set directly from the character show page without
  navigating to the photos sub-page.
