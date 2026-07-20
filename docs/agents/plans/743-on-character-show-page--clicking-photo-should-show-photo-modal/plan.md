# Plan: On Character show page, clicking photo should show photo modal

Issue: [743-on-character-show-page--clicking-photo-should-show-photo-modal.md](../issues/743-on-character-show-page--clicking-photo-should-show-photo-modal.md)

## Overview

The PC/NPC character show pages render a static (non-clickable) preview grid of up to 6
photos via `CharacterPhotosPreviewHelper`. This plan wires up a click handler on each
preview photo card to open the existing `PhotoViewModal` (the same component already used
on the dedicated photos-index pages), with full parity to that page's behavior — including
the "set as profile photo" action — but without adding gallery next/prev navigation.

## Context

- `PhotoViewModal` (`frontend/assets/js/components/common/modals/PhotoViewModal.jsx`)
  already supports everything needed: `show`, a single `photo`, `alt`, `onClose`,
  `canSetProfilePhoto`, `isProfilePhoto`, `onSetProfilePhoto`. No changes needed to the
  modal itself.
- The reference implementation for full parity is `CharacterPhotos.jsx`
  (`frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx:24-102`),
  which:
  - Keeps `selectedPhoto` state (opens `PhotoViewModal` when non-null).
  - Keeps `profilePhotoSet` state + renders `ProfilePhotoSetModal` as post-success
    confirmation.
  - Keeps `actionError` state + renders `ErrorAlert` when setting the profile photo fails.
  - `handleSetProfilePhoto(photoId)` calls `controller.setProfilePhoto(gameSlug,
    characterId, photoId)`, then shows the confirmation modal on success or the error
    alert on failure.
- The show page's controller, `CharacterController`
  (`frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`),
  does **not** currently have a `setProfilePhoto` method — unlike
  `BaseCharacterPhotosController` (`.../controllers/BaseCharacterPhotosController.js:87-93`),
  which the photos-index controllers already have. `CharacterController` extends
  `CharacterListsController`, which already constructs `this.characterClient` (a
  `CharacterClient` instance) — the same client class `BaseCharacterPhotosController` uses,
  and it already exposes `setPhotoRoles`. So a `setProfilePhoto` method can be added to
  `CharacterController` itself, calling `this.characterClient.setPhotoRoles(...)` directly
  (mirroring `BaseCharacterPhotosController#setProfilePhoto`), without needing to also
  refetch internally — `CharacterDetail.jsx` already refreshes via `controller.buildEffect()()`
  after other mutations (see `handleUploadSuccess`/`handleMoneyConfirm`,
  `CharacterDetail.jsx:66-78`), so the new handler should follow that same pattern rather
  than duplicating a private refetch like the photos controller does.
- `character.profile_photo_id` is already present on the base (non-editor) character detail
  serializer (`backend/games/serializers/characters/character_detail.py:22-24`), so no
  backend change is required — this is a frontend-only issue.
- The preview cards themselves stay as the existing plain `CardPhoto`-in-`<div className="card h-100">`
  markup (`CharacterPhotosPreviewHelper.jsx:47-58`) — just becoming clickable. They are
  **not** switched to the `PhotoCard` component used on the photos-index page.

## Implementation Steps

### Step 1 — Make preview photo cards clickable

In `CharacterPhotosPreviewHelper.jsx`, add an `onSelectPhoto` parameter to `render`/`#renderBody`
and wrap each preview card's clickable surface with an `onClick={() => onSelectPhoto(photo)}`
handler (e.g. on a `<button>`-like element, or a wrapping element with `role="button"`/
`tabIndex`/`onKeyDown` if a real `<button>` doesn't fit the existing `card h-100` markup
cleanly — follow whatever minimal-markup approach keeps the existing visual layout, since
the accepted answer was "add click handler to existing CardPhoto", not a re-architecture).
Update `CharacterPhotosPreview.jsx` to accept and forward an `onSelectPhoto` prop.

### Step 2 — Wire modal state into `CharacterHelper.jsx`

Add an `onSelectPhoto` handler to the `handlers` object accepted by `CharacterHelper.render`
(alongside the existing `onOpenUploadModal`/`onOpenMoneyModal`/etc.), and pass it through to
`<CharacterPhotosPreview onSelectPhoto={handlers.onSelectPhoto} ... />` (`CharacterHelper.jsx:133-137`).

### Step 3 — Add profile-photo API call to `CharacterController`

Add a `setProfilePhoto(gameSlug, characterId, photoId)` method to `CharacterController.js`,
mirroring `BaseCharacterPhotosController#setProfilePhoto` but only performing the API call
(no internal refetch) — call `this.characterClient.setPhotoRoles(this.characterKind, gameSlug,
characterId, photoId, AuthStorage.getToken(), ['profile'])` and return the promise.

### Step 4 — Wire state, modal, and handlers into `CharacterDetail.jsx`

Following the `CharacterPhotos.jsx` pattern (`CharacterPhotos.jsx:24-102`):
- Add `selectedPhoto`, `profilePhotoSet`, `actionError` state.
- Add `handleSetProfilePhoto(photoId)`: find the photo in `character.photos` (fallback to
  `selectedPhoto`), call `controller.setProfilePhoto(gameSlug, character.id, photoId)`, then
  on success set `profilePhotoSet` to that photo and refresh via `controller.buildEffect()()`
  (so `character.profile_photo_id`/`profile_photo_path` update); on failure set `actionError`.
- Pass `onSelectPhoto: setSelectedPhoto` into the handlers object passed to `CharacterHelper.render`.
- Render `{actionError && <ErrorAlert error={actionError} />}` above the page content (or in
  the same position `CharacterPhotos.jsx` uses it).
- Render `<PhotoViewModal show={selectedPhoto !== null} photo={selectedPhoto} alt={character.name}
  onClose={() => setSelectedPhoto(null)} canSetProfilePhoto={character.can_edit}
  isProfilePhoto={selectedPhoto?.id === character.profile_photo_id}
  onSetProfilePhoto={handleSetProfilePhoto} />`.
- Render `<ProfilePhotoSetModal show={profilePhotoSet !== null} photo={profilePhotoSet}
  alt={character.name} onClose={() => setProfilePhotoSet(null)} />`.
- Add a translation key for the set-profile-photo error message if
  `character_photos_page.set_profile_photo_error` (used by `CharacterPhotos.jsx:62`) isn't
  generic enough to reuse as-is — check `frontend/assets/i18n/` and reuse the existing key if
  its wording fits both contexts, otherwise add a new key following the translator conventions
  (see `frontend/assets/i18n/` and the project's translation-sync script).

### Step 5 — Update/add tests

- Update `frontend/specs/.../CharacterHelper/photosPreviewSpec.js` — the assertion "does not
  wrap the photo cards in a clickable control" (lines 18-25) must change to assert the cards
  **are** clickable and invoke `onSelectPhoto` with the right photo.
- Update `CharacterPhotosPreviewSpec.js` / `CharacterPhotosPreviewHelperSpec.js` for the new
  `onSelectPhoto` prop/param.
- Add coverage in `CharacterSpec.js` (or `CharacterDetail`'s own spec, if one exists) for:
  opening `PhotoViewModal` on photo click, closing it, the "set as profile photo" success
  path (shows `ProfilePhotoSetModal`, refreshes character), and the failure path (shows
  `ErrorAlert`).

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx` — add `onSelectPhoto` param, make cards clickable.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx` — forward `onSelectPhoto` prop.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — accept/forward `onSelectPhoto` handler.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` — add `setProfilePhoto` method.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — add `selectedPhoto`/`profilePhotoSet`/`actionError` state, `handleSetProfilePhoto`, render `PhotoViewModal`/`ProfilePhotoSetModal`/`ErrorAlert`.
- `frontend/assets/i18n/*` — new/reused translation key for the set-profile-photo error message, if needed (run the i18n sync check).
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelper/photosPreviewSpec.js` — update non-clickable assertion.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterPhotosPreviewSpec.js`, `.../elements/helpers/CharacterPhotosPreviewHelperSpec.js` — update for new prop.
- `frontend/specs/assets/js/components/resources/character/pages/CharacterSpec.js` (or equivalent `CharacterDetail` spec) — new coverage for modal open/close and set-profile-photo flow.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — only relevant if a new translation key is added.

## Notes

- No backend changes are required — `profile_photo_id` is already returned by the base
  character detail serializer, and `setPhotoRoles` already exists on `CharacterClient`.
- No gallery next/prev navigation is introduced (per the confirmed scope) — `PhotoViewModal`
  keeps its current single-photo behavior.
- Preview cards keep their current visual appearance (`CardPhoto` in a plain `.card`) — no
  switch to `PhotoCard`/hover action bar.
- Double check whether `character_photos_page.set_profile_photo_error`'s translated text is
  generic enough to reuse verbatim from the show page, since it's currently scoped by name to
  the "photos page" — an issue-specific but easy call for whichever agent implements this.
