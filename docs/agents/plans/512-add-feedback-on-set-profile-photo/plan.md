# Plan: Add feedback on set profile photo

Issue: [512-add-feedback-on-set-profile-photo.md](../issues/512-add-feedback-on-set-profile-photo.md)

## Overview

Clicking the "set as profile photo" button (`bi-postage-fill`) on a character's photos
page currently calls the API and swallows the result entirely
(`.catch(Noop.noop)`). This plan adds: a success modal confirming the change and
showing the picture; a plain inline error message on failure; and a green border
around the current profile photo in the grid, which already has the data it needs
(`isProfilePhoto`) and updates for free once the existing character refetch completes.

## Context

- Route: `/#/games/:game_slug/pcs/:id/photos` (and the equivalent NPC route — both
  share the same `CharacterPhotos` component).
- Click flow: `PhotoCard`/`PhotoViewModal` → `onSetProfilePhoto(photo.id)` →
  `CharacterPhotos.jsx#handleSetProfilePhoto` →
  `BaseCharacterPhotosController#setProfilePhoto` → `CharacterClient.setPhotoRoles`
  (PATCH), then `#fetchCharacter` refetches the whole character (updating
  `profile_photo_id`), then result is discarded via `.catch(Noop.noop)`.
- Per issue clarification: the success modal must wait for the character refetch to
  finish before showing (so `profile_photo_id`/border state is already correct when
  it appears) — no optimistic in-memory patch needed, the existing refetch-and-replace
  pattern already covers it.
- Per issue clarification: on failure, show a plain message (no modal).
- Per issue clarification: the green border only applies to the grid (`PhotoCard`),
  not the lightbox (`PhotoViewModal`).
- The page's existing `error`/`ErrorAlert` state is a full-page swap used only for the
  initial photos/character load failure (`CharacterPhotos.jsx`: `if (error) return
  PhotosHelper.renderError(error)`) — reusing it for a transient action failure would
  wipe the whole grid, so this needs a separate, non-full-page error state. The
  existing precedent for an inline (non-page-replacing) `alert-danger` is
  `PhotoUploadModalHelper.#renderError` (an alert rendered inside a modal, not a full
  page).
- The green border color convention (`border border-success`) already exists in this
  codebase for a different feature (`frontend/assets/js/utils/ui/AllegianceBorder.js`)
  — reuse the same Bootstrap classes directly on the photo card, no need to reuse that
  util itself (different domain/semantics).
- Existing modal triads in this codebase either use a dedicated controller (when there
  is async logic of their own, e.g. `PhotoUploadModal` + `PhotoUploadModalController`)
  or are purely presentational when the parent already owns all the state/logic (e.g.
  `SlainConfirmModal` + `SlainConfirmModalHelper`, no controller). The new success
  modal has no logic of its own (just show the given photo, and a Close button), so it
  follows the `SlainConfirmModal` shape: Component + Helper only.

## Implementation Steps

### Step 1 — Track action feedback state in `CharacterPhotos.jsx`

In `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`:

- Add `const [profilePhotoSet, setProfilePhotoSet] = useState(null);` (the photo just
  set as profile, or `null` when no success modal should show).
- Add `const [actionError, setActionError] = useState('');` for the transient failure
  message, distinct from the existing page-level `error` state.
- Rewrite `handleSetProfilePhoto`:

  ```js
  const handleSetProfilePhoto = (photoId) => {
    setActionError('');
    const photo = photos.find((p) => p.id === photoId) ?? selectedPhoto;

    controller.setProfilePhoto(gameSlug, characterId, photoId)
      .then(() => setProfilePhotoSet(photo))
      .catch(() => setActionError(Translator.t('character_photos_page.set_profile_photo_error')));
  };
  ```

  This relies on `controller.setProfilePhoto` continuing to resolve only after the
  character refetch completes (see Step 2) — so the modal is guaranteed to render
  with an already-updated `character.profile_photo_id`.
- Render, near the top of the returned fragment (so it doesn't replace the grid):
  `{actionError && <ErrorAlert error={actionError} />}` — reusing the existing
  `ErrorAlert` component itself is fine here since it's just rendering a dismiss-free
  inline alert *alongside* the grid, not swapping the whole page (only the page-level
  `if (error) return ...` short-circuit was the problem, not the component).
- Render the new modal:

  ```jsx
  <ProfilePhotoSetModal
    show={profilePhotoSet !== null}
    photo={profilePhotoSet}
    alt={alt}
    onClose={() => setProfilePhotoSet(null)}
  />
  ```

### Step 2 — Stop swallowing errors in the controller

In `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js`,
`setProfilePhoto` currently ends with `.catch(Noop.noop)`, discarding both the PATCH
result and any refetch failure. Remove that `.catch` (or narrow it) so the returned
promise rejects on failure and resolves only once `#fetchCharacter` has finished on
success — `CharacterPhotos.jsx` (Step 1) now owns success/error handling via
`.then`/`.catch` on the returned promise. Drop the now-unused `Noop` import from this
file if nothing else in it uses it.

### Step 3 — Add the `ProfilePhotoSetModal` component

Add two new files under `frontend/assets/js/components/common/`, following the
`SlainConfirmModal` shape (Component + Helper, no controller — no logic of its own):

- `ProfilePhotoSetModal.jsx` — thin wrapper, props `{ show, photo, alt, onClose }`,
  delegates to the helper.
- `helpers/ProfilePhotoSetModalHelper.jsx` — renders a `react-bootstrap` `Modal` with:
  - `Modal.Header` with a title (new i18n key, see Step 5) and close button.
  - `Modal.Body`: the photo image (`<img src={photo.path} alt={alt} className="img-fluid" />`,
    guarded for `photo == null` the same way `PhotoViewModalHelper.#renderPhoto`
    does), plus the confirmation text.
  - `Modal.Footer`: a single Close button (`btn btn-secondary`) calling `onClose`.

### Step 4 — Highlight the profile photo in the grid

In `frontend/assets/js/components/common/helpers/PhotoCardHelper.jsx`, `render()`
builds `<div className="card h-100">...</div>` around the photo. Change that
className to conditionally add the green border when `isProfilePhoto` is true, e.g.:

```js
const cardClassName = isProfilePhoto ? 'card h-100 border border-success' : 'card h-100';
```

No prop plumbing changes needed — `isProfilePhoto` is already passed all the way down
from `BaseCharacterPhotosHelper.jsx` (`isProfilePhoto={photo.id === profilePhotoId}`).
Do **not** touch `PhotoViewModalHelper.jsx` — the border is grid-only per the issue.

### Step 5 — Translations

Add new keys to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`
(keep both in sync, matching existing key ordering/style):

- `character_photos_page.set_profile_photo_error` — e.g. "Failed to set profile
  photo. Please try again." (mirrors `photo_upload_modal.error`'s phrasing).
- A new `profile_photo_set_modal` namespace, e.g.:
  ```yaml
  profile_photo_set_modal:
    title: Profile Photo Updated
    body: This picture is now the profile photo.
    close: Close
  ```
- Run `npm run check_i18n` (see CI Checks below) after editing to confirm both files
  stay in sync.

### Step 6 — Tests

- `frontend/specs/assets/js/components/resources/character/pages/CharacterPhotosSpec.js`
  and/or `.../controllers/CharacterPhotosController/`: cover the new
  success-shows-modal and failure-shows-error-message paths for
  `handleSetProfilePhoto`.
- `frontend/specs/assets/js/components/common/helpers/PhotoCardHelperSpec.js`: assert
  the `border border-success` class is present when `isProfilePhoto` is true and
  absent otherwise.
- New spec files for the modal, mirroring an existing simple-modal spec (e.g. the
  `SlainConfirmModal`/`SlainConfirmModalHelper` specs) — one for
  `ProfilePhotoSetModal.jsx`, one for `ProfilePhotoSetModalHelper.jsx`.
- Update/add a controller spec covering that `setProfilePhoto` now rejects (instead of
  swallowing) on a failed PATCH or failed refetch.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — add
  `profilePhotoSet`/`actionError` state, rewrite `handleSetProfilePhoto`, render the
  new modal and the inline error alert.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js` —
  stop swallowing `setProfilePhoto` errors; drop unused `Noop` import if applicable.
- `frontend/assets/js/components/common/ProfilePhotoSetModal.jsx` — new file.
- `frontend/assets/js/components/common/helpers/ProfilePhotoSetModalHelper.jsx` — new file.
- `frontend/assets/js/components/common/helpers/PhotoCardHelper.jsx` — add the
  conditional `border border-success` class.
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml` — new translation
  keys (Step 5).
- Corresponding spec files under `frontend/specs/assets/js/...` mirroring each file
  above (Step 6).

## CI Checks

- `frontend`: `npm test` (CI job runs Jasmine specs)
- `frontend`: `npm run coverage` (CI job: coverage)
- `frontend`: `npm run check_i18n` (CI job: i18n sync check — must pass after Step 5)
- `frontend`: `npm run lint` (CI job: lint)

## Notes

- This plan assumes `controller.setProfilePhoto`'s promise, once the `.catch(Noop.noop)`
  is removed, naturally rejects when either `setPhotoRoles` or the subsequent
  `#fetchCharacter` rejects — worth double-checking `#fetchCharacter`'s own internal
  `.catch` (`BaseCharacterPhotosController.js:105-112`) doesn't itself swallow errors
  before they propagate (it currently resolves via `safeSet(this.setCharacter, {
  can_edit: false })` on fetch failure rather than rejecting — if that's judged
  desirable to keep for the initial page-load path, `setProfilePhoto` may need its own
  narrower error handling around just the `setPhotoRoles` call rather than relying on
  `#fetchCharacter` to reject).
- The issue applies to PC photos (the reported route), but `CharacterPhotos.jsx` is
  shared with NPC photos — this plan's changes apply to both automatically since
  they're all in the shared component/controller/helper, not the PC-specific
  wrappers.
