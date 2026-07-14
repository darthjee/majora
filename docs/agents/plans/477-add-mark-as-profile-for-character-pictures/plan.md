# Plan: Add mark as profile action bar for character photos

Issue: [477-add-mark-as-profile-for-character-pictures.md](../../issues/477-add-mark-as-profile-for-character-pictures.md)

## Overview

Add a hover action-bar icon (bootstrap `postage`) to each `PhotoCard` on the character photos gallery pages (`/#/games/:game_slug/pcs/:id/photos` and `/#/games/:game_slug/npcs/:id/photos`), letting an editor mark that photo as the character's profile photo directly from the grid — without opening the existing lightbox modal. This is frontend-only: the backend endpoint (`PATCH .../photos/:photo_id/set.json`) and the client/controller wiring (`CharacterClient#setPhotoRoles`, `BaseCharacterPhotosController#setProfilePhoto`) already exist from issue #280 and are reused as-is.

## Context

`CharacterPhotos.jsx` already defines `handleSetProfilePhoto` and passes `canSetProfilePhoto`/`isProfilePhoto`/`onSetProfilePhoto` to `PhotoViewModal` (the lightbox), but these are never passed down to `BaseCharacterPhotosHelper.render`, so `PhotoCard` has no way to trigger the action inline. `PhotoCard`/`PhotoCardHelper` currently render only a plain clickable button (opens the lightbox) with no hover overlay. The existing `.actions-overlay` / `.actions-overlay-button-right*` CSS (in `frontend/assets/css/main.scss`) and the `ActionBar` component already implement the exact hover-reveal behavior needed (used today for the NPCs list's slain/revive buttons) — this plan reuses them rather than inventing new CSS.

`PhotoCard` is also used by `GamePhotosHelper` (game-level photos, not character-level). The new props must be optional/default-off so that usage is unaffected.

## Implementation Steps

### Step 1 — Add the `postage` icon

In `frontend/assets/js/utils/ui/Icons.js`, add `postage: 'bi-postage-fill'` alongside the existing entries.

### Step 2 — Thread profile-photo props through to `PhotoCard`

- In `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`, add `onSetProfilePhoto: handleSetProfilePhoto` to the `handlers` object passed into `PhotosHelper.render(...)`, and pass `character.profile_photo_id` as a new argument (or fold it into the existing `character` value already available to the helper — pick whichever keeps the `render` signature closest to its current shape).
- In `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx`, accept the profile photo id and pass down to each `PhotoCard`:
  - `canSetProfilePhoto={canEdit}`
  - `isProfilePhoto={photo.id === profilePhotoId}`
  - `onSetProfilePhoto={handlers.onSetProfilePhoto}`

### Step 3 — Render the hover action bar on `PhotoCard`

- In `frontend/assets/js/components/common/PhotoCard.jsx` and `helpers/PhotoCardHelper.jsx`, accept the three new optional props (default `canSetProfilePhoto=false`, `isProfilePhoto=false`).
- Wrap the existing card markup in a `<div className="actions-overlay">` (reusing the existing CSS, no new stylesheet needed) as a sibling to the existing clickable button (not nested inside it, so the icon click never bubbles into the card's "open lightbox" click).
- Render `ActionBar` with `canEdit={false}` (no upload button here — upload happens elsewhere on the page) and a single secondary button when `canSetProfilePhoto && !isProfilePhoto`:
  ```js
  { label: Translator.t('photo_view_modal.set_profile_photo'), variant: 'primary', icon: Icons.postage, onClick: () => onSetProfilePhoto(photo.id) }
  ```
  Reuse the existing `photo_view_modal.set_profile_photo` translation key for the button's `label`/`aria-label`/`title` — no new i18n key needed.
- Do not touch `GamePhotosHelper`/game photos usage — it simply won't pass the new props, so no action bar renders there.

### Step 4 — Tests

- `frontend/specs/assets/js/components/common/PhotoCardSpec.js`: add cases for the action bar rendering when `canSetProfilePhoto` is true and `isProfilePhoto` is false (icon button present), hidden when `isProfilePhoto` is true or `canSetProfilePhoto` is false, and that clicking it calls `onSetProfilePhoto` with the photo id (not `onClick`).
- `frontend/specs/assets/js/components/resources/character/pages/CharacterPhotosSpec.js` (and/or a `BaseCharacterPhotosHelper` spec if one is added): verify `profile_photo_id`/`onSetProfilePhoto` flow from the page down into the rendered markup.

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — add the `postage` icon mapping
- `frontend/assets/js/components/common/PhotoCard.jsx` — accept and forward the new props
- `frontend/assets/js/components/common/helpers/PhotoCardHelper.jsx` — render the hover `ActionsOverlay`/`ActionBar` with the "mark as profile" secondary button
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — pass `onSetProfilePhoto` and the profile photo id down to the helper
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx` — forward the new props to each `PhotoCard`
- `frontend/specs/assets/js/components/common/PhotoCardSpec.js` — new test cases
- `frontend/specs/assets/js/components/resources/character/pages/CharacterPhotosSpec.js` — new/updated test cases

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run check_i18n` && lint (CI job: `frontend-checks`)

## Notes

- No backend changes: `PATCH /games/:game_slug/pcs|npcs/:id/photos/:photo_id/set.json` (permission, photo-ownership validation) already covers everything this issue needs.
- The existing lightbox "Set as profile photo" button in `PhotoViewModal` is left untouched; this adds a second, faster path to the same action.
- Only one agent (frontend) has work here, so this is a single unsplit plan.
