# Issue: Add feedback on set profile photo

## Description
On `/#/games/:game_slug/pcs/:id/photos`, each photo card has a button (`bi-postage-fill` icon) to set that photo as the character's profile picture. Clicking it currently calls the API and silently swallows the result — there is no feedback to the user at all, whether the request succeeds or fails.

## Problem
- On success, the user gets no confirmation that the profile photo was actually changed.
- On failure, the error is silently swallowed (`.catch(Noop.noop)` in `BaseCharacterPhotosController#setProfilePhoto`), so the user has no idea the action failed.
- Nothing in the photo grid visually indicates which photo is currently the profile photo.

## Expected Behavior
- On success: after the character is refetched (so `profile_photo_id` and related state are already up to date), open a modal confirming the picture was set as profile photo, showing the picture itself. The modal has only a Close button.
- On failure: show an error message (no modal) so the user knows the action didn't succeed.
- In the photo grid (`PhotoCard`), the photo currently set as the profile photo is highlighted with a green border. This updates live as soon as a new photo is chosen — no page refresh needed. This highlight applies to the grid only, not the fullscreen lightbox (`PhotoViewModal`).

## Solution
- Reuse the existing Component + Controller + Helper modal triad pattern (see `PhotoUploadModal.jsx`, `PhotoViewModal.jsx`) to build a new success modal, Bootstrap-based, with a single Close action.
- In `BaseCharacterPhotosController#setProfilePhoto` (`frontend/assets/js/components/resources/character/pages/shared/controllers/BaseCharacterPhotosController.js`), replace the current `.catch(Noop.noop)` no-op with:
  - on success (after the existing character refetch completes): trigger the new success modal, passing the photo.
  - on failure: surface an error message via the existing error-alert pattern (`ErrorAlert.jsx`) instead of swallowing it.
- The green border on the profile photo already has the data it needs: `PhotoCard`/`BaseCharacterPhotosHelper.jsx` already compute `isProfilePhoto={photo.id === profilePhotoId}` per card — add the border styling driven by that existing prop. Because the controller already refetches the whole character (updating `profile_photo_id`) before showing the modal, the grid re-render with the new highlight comes for free from the existing refetch-and-replace pattern; no separate in-memory patch is needed.

## Benefits
- Users get clear, immediate confirmation that changing the profile photo worked (or a clear signal when it didn't), instead of the current silent no-op.
- The profile photo is easy to identify at a glance while browsing the photo grid.
