# Issue: On Character show page, clicking photo should show photo modal

## Description
On the PC/NPC character show pages (`/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/npcs/:id`), a preview grid of up to 6 photos is rendered near the bottom of the page by `CharacterPhotosPreviewHelper` (frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx). Each photo is currently displayed via `CardPhoto` inside a plain, non-interactive `<div>` — clicking it does nothing. Only the trailing "See all" card navigates away to the dedicated photos page (`/#/games/:game_slug/pcs/:id/photos`, `/#/games/:game_slug/npcs/:id/photos`).

## Problem
Users browsing a character's photo preview on the show page have no way to view a photo at full size, or set it as the profile photo, without leaving the page to open the separate photos index.

## Expected Behavior
Clicking any photo thumbnail in the show page's photo preview list opens `PhotoViewModal` (frontend/assets/js/components/common/modals/PhotoViewModal.jsx) showing that single photo — the same modal component already used on the photos index pages (`CharacterPhotos.jsx`), including the existing "set as profile photo" action when `character.can_edit` is true. No gallery/next-prev navigation is introduced; this matches the modal's current single-photo capability.

## Solution
- Add an `onClick` handler directly to the existing (plain) photo cards in `CharacterPhotosPreviewHelper.jsx` — no switch to the `PhotoCard` component, keeping the preview's visual appearance unchanged.
- Introduce `selectedPhoto` state and render `<PhotoViewModal>` where the show page already keeps its other modal state (`CharacterDetail.jsx`, alongside `showUploadModal`/`showMoneyModal`), passing it down to the preview section.
- Wire `canSetProfilePhoto`/`isProfilePhoto`/`onSetProfilePhoto` the same way `CharacterPhotos.jsx` does, so the show-page modal has full parity with the photos-page modal.
- Update the existing Jasmine spec asserting the preview cards are non-clickable (`photosPreviewSpec.js`) to reflect the new clickable behavior, and add coverage for opening/closing the modal from the show page.

## Benefits
Consistent photo-viewing UX across the app — full parity with the photos-index modal (view + set-as-profile-photo) — without forcing navigation to a separate page just to see or manage a photo.
