# Frontend Plan: Add set profile photo on characters page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes a new `can_set_profile_photo` (bool) field on the character object returned by
`GET /games/<slug>/pcs|npcs/<id>.json` (see backend plan). Replace every existing use of
`character.can_edit` that gates "may this user set a profile photo" with
`character.can_set_profile_photo` — `can_edit` itself is unchanged and keeps gating the Edit
button.

## Implementation Steps

### Step 1 — Add the action button to the show page's photo preview grid

`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx`
currently renders each preview photo as a bare `CardPhoto` inside a plain `col-*` div
(`#renderBody`/`#renderCard`). Change it to render each photo via the existing
`PhotoCard`/`PhotoCardHelper` component (`frontend/assets/js/components/common/cards/PhotoCard.jsx`,
`.../helpers/PhotoCardHelper.jsx`) instead — the same component the photos sub-page already uses
(`BaseCharacterPhotosHelper.jsx` line ~59-67) — since `PhotoCardHelper.render` already returns its
own `col-6 col-sm-4 col-md-3 col-lg-2 mb-4` wrapper, drop the wrapping `<div className="col-6...">`
currently added by `#renderBody`'s `.map()` and let each card supply its own wrapper (matching how
`BaseCharacterPhotosHelper.jsx` does it).

`render()` needs three new parameters — `canSetProfilePhoto`, `profilePhotoId`, `onSetProfilePhoto`
— threaded through to `#renderBody`/`#renderCard`, which then passes
`isProfilePhoto={photo.id === profilePhotoId}` and the other two straight through to
`PhotoCard`/`PhotoCardHelper.render`, exactly as `BaseCharacterPhotosHelper.jsx` does.

### Step 2 — Thread the new props down from the show page

- `frontend/assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx`:
  accept `canSetProfilePhoto`, `profilePhotoId`, `onSetProfilePhoto` props and pass them through to
  `CharacterPhotosPreviewHelper.render`.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx`:
  read `can_set_profile_photo` and `profile_photo_id` off the merged `context` (already available —
  `CharacterHelper.render` spreads the full character object into `context`, see
  `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` line 84),
  and `handlers.onSetProfilePhoto`; pass them to `CharacterPhotosPreview` as
  `canSetProfilePhoto`, `profilePhotoId`, `onSetProfilePhoto`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx`: add
  `onSetProfilePhoto: handleSetProfilePhoto` to the handlers object passed into
  `CharacterHelper.render(character, backHref, { ... })` (the handler already exists at line
  104-114 and already calls `controller.buildEffect()()` to reload the character after success —
  no new reload mechanism needed).

### Step 3 — Align the existing `can_edit`-based gating with the new field

Replace `character.can_edit` with `character.can_set_profile_photo` at the three existing call
sites that gate "set as profile photo" visibility (all currently reuse `can_edit`, which is about
to diverge from the widened backend rule):

- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` —
  `PhotoViewModal`'s `canSetProfilePhoto={character.can_edit}` prop.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — both the
  `PhotosHelper.render(...)` call's `character.can_edit` argument (second positional arg, mapped to
  `canSetProfilePhoto` in `BaseCharacterPhotosHelper.jsx`) and `PhotoViewModal`'s
  `canSetProfilePhoto={character.can_edit}` prop. Do **not** change `canUploadPhoto` (stays
  `character.can_edit || character.is_player || character.is_staff` — a separate, pre-existing
  frontend approximation of the upload permission, out of scope for this issue).

### Step 4 — Tests

- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelperSpec.js`:
  add cases for the new `canSetProfilePhoto`/`profilePhotoId`/`onSetProfilePhoto` params — button
  renders when allowed and photo isn't already the profile photo, hidden otherwise, click invokes
  `onSetProfilePhoto` with the photo id.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterPhotosPreviewSpec.js`
  and `.../elements/show/CharacterPhotosPreviewSlotSpec.js`: extend to cover the new props being
  read from `context`/passed through.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterDetailPhotoModalSpec.js`:
  update/add cases asserting the grid's new action button calls `handleSetProfilePhoto` and that
  `canSetProfilePhoto` now derives from `can_set_profile_photo`, not `can_edit`.
- `frontend/specs/assets/js/components/resources/character/pages/CharacterPhotosSpec.js`: update
  any assertions tied to `character.can_edit` gating the profile-photo action to use
  `character.can_set_profile_photo` instead.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx`
  — render via `PhotoCard`/`PhotoCardHelper`, accept new params.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx` —
  thread new props.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx`
  — read `can_set_profile_photo`/`profile_photo_id`/`handlers.onSetProfilePhoto` from context.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — wire
  `onSetProfilePhoto` handler into `CharacterHelper.render`; switch `PhotoViewModal`'s
  `canSetProfilePhoto` to `character.can_set_profile_photo`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — switch
  both `canSetProfilePhoto` call sites to `character.can_set_profile_photo`.
- `frontend/specs/.../elements/helpers/CharacterPhotosPreviewHelperSpec.js`,
  `.../elements/CharacterPhotosPreviewSpec.js`, `.../elements/show/CharacterPhotosPreviewSlotSpec.js`,
  `.../shared/CharacterDetailPhotoModalSpec.js`, `.../pages/CharacterPhotosSpec.js` — updated/new
  specs per Step 4.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- No new translation keys are needed — `photo_view_modal.set_profile_photo` and
  `character_photos_page.set_profile_photo_error` are already defined and reused as-is.
- `PhotoCardHelper.render`'s positional-argument signature (`photo, alt, onClick,
  canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto`) is unchanged by this issue; only new
  call sites are added.
