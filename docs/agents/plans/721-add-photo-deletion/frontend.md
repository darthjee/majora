# Frontend Plan: Add photo deletion

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts". This agent consumes: the `can_delete_photo` boolean already arriving on `character` (same path as the existing `can_set_profile_photo`, no extra fetch needed), and the `PATCH`/`DELETE` `.../photos/:photo_id.json` endpoints (same URL, method-dispatched backend-side). It also references the new i18n keys `translator.md` will add.

## Implementation Steps

### Step 1 — Add `DELETE` support to the client stack (currently missing entirely)

`frontend/assets/js/client/BaseClient.js` — add, next to `putJson`:

```js
deleteJson(path, token, fields = {}, extraHeaders = {}) {
  return this.#writeJson('DELETE', path, token, fields, extraHeaders);
}
```

`frontend/assets/js/utils/requests/RequestMutationClient.js` — add to `WRITERS`:

```js
const WRITERS = {
  POST: 'postJson',
  PATCH: 'patchJson',
  PUT: 'putJson',
  DELETE: 'deleteJson',
};
```

### Step 2 — New `photoDelete` resource config entry

In `frontend/assets/js/utils/requests/config/pcConfig.js`, add (mirroring `photoSet`'s shape):

```js
const photoDelete = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/pcs/${id}/photos/${photoId}.json`,
  permission: 'can_delete_photo',
};
```

and register it under both `PATCH` and a new top-level `DELETE` key:

```js
export default {
  GET: { /* unchanged */ },
  PATCH: {
    single: { regular: patchRegular, private: patchPrivate },
    photo: { regular: photoSet, private: photoSet },
    photoDelete: { regular: photoDelete, private: photoDelete },
  },
  PUT: { /* unchanged */ },
  POST: { /* unchanged */ },
  DELETE: {
    photoDelete: { regular: photoDelete, private: photoDelete },
  },
};
```

Same change in `frontend/assets/js/utils/requests/config/npcConfig.js`, with `/npcs/` in the path. Update each file's top-of-file doc comment (following the existing convention there) to document the new `photoDelete` quantity type, same style as the existing `photo` entry's note.

### Step 3 — New `PhotoDeleteSaga`

New `frontend/assets/js/components/common/base/controllers/PhotoDeleteSaga.js`, mirroring `PhotoUploadSaga.js`'s two-step shape, but composing two `RequestStore.mutate` calls (`quantityType: 'photoDelete'`) instead of wrapping `UploadClient`:

1. `mutate({ resource, method: 'PATCH', quantityType: 'photoDelete', params: { gameSlug, id, photoId }, body: { ready: false } })`
2. On success, `mutate({ resource, method: 'DELETE', quantityType: 'photoDelete', params: { gameSlug, id, photoId } })`

If step 1 fails, do not attempt step 2 — surface the error the same way `handleSetProfilePhoto` surfaces `actionError` today (see Step 5).

### Step 4 — `deletePhoto` on the character photos controller

`frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js` — add, next to `setProfilePhoto`:

```js
deletePhoto(gameSlug, characterId, photoId) {
  return PhotoDeleteSaga.run(this.characterKind === 'pcs' ? 'pc' : 'npc', gameSlug, characterId, photoId)
    .then(() => this.#fetchCharacter(gameSlug, characterId, safeSet));
}
```

(adjust to whatever exact static/instance shape `PhotoDeleteSaga` ends up with — follow `PhotoUploadSaga`'s actual call convention rather than guessing a new one). Refetching the character after delete both drops the deleted photo from the list (assuming the photos list is refetched too, or the deleted photo is filtered out of local state) and refreshes `profile_photo_id`/`can_delete_photo`.

### Step 5 — Wire the confirm modal into `CharacterPhotos.jsx`

`frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — add state and handlers next to the existing `handleSetProfilePhoto`:

```jsx
const [pendingDeletePhoto, setPendingDeletePhoto] = useState(null);

const handleRequestDeletePhoto = (photoId) => {
  const photo = photos.find((p) => p.id === photoId) ?? selectedPhoto;
  setPendingDeletePhoto(photo);
};

const handleConfirmDeletePhoto = () => {
  setActionError('');
  controller.deletePhoto(gameSlug, characterId, pendingDeletePhoto.id)
    .then(() => setPendingDeletePhoto(null))
    .catch(() => {
      setActionError(Translator.t('character_photos_page.delete_photo_error'));
      setPendingDeletePhoto(null);
    });
};
```

Render a new `<DeletePhotoConfirmModal show={pendingDeletePhoto !== null} photo={pendingDeletePhoto} onConfirm={handleConfirmDeletePhoto} onCancel={() => setPendingDeletePhoto(null)} />` alongside the existing `PhotoUploadModal`/`PhotoViewModal`/`ProfilePhotoSetModal`. Thread `onDelete: handleRequestDeletePhoto` into `PhotosHelper.render(...)`'s handlers object (alongside the existing `onSetProfilePhoto`).

### Step 6 — New `DeletePhotoConfirmModal` + helper

New `frontend/assets/js/components/resources/character/pages/elements/DeletePhotoConfirmModal.jsx`, mirroring `SlainConfirmModal.jsx`:

```jsx
export default function DeletePhotoConfirmModal({ show, photo, onConfirm, onCancel }) {
  return DeletePhotoConfirmModalHelper.render(show, photo, { onConfirm, onCancel });
}
```

New `frontend/assets/js/components/resources/character/pages/elements/helpers/DeletePhotoConfirmModalHelper.jsx`, mirroring `SlainConfirmModalHelper.jsx`, but with a fixed `btn-danger` confirm variant and the new i18n keys:

```jsx
static render(show, photo, handlers) {
  return (
    <Modal show={show} onHide={handlers.onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{Translator.t('delete_photo_confirm_modal.title')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{Translator.t('delete_photo_confirm_modal.body')}</Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
          {Translator.t('delete_photo_confirm_modal.cancel')}
        </button>
        <button className="btn btn-danger" type="button" onClick={handlers.onConfirm}>
          {Translator.t('delete_photo_confirm_modal.confirm')}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
```

### Step 7 — Delete button on `PhotoCard`

`frontend/assets/js/components/common/cards/PhotoCard.jsx` — add `canDelete`/`onDelete` props, threaded into the helper alongside the existing `canSetProfilePhoto`/`onSetProfilePhoto`.

`frontend/assets/js/components/common/cards/helpers/PhotoCardHelper.jsx` — extend `#buildSecondaryButtons` to also push a delete entry when `canDelete` is true:

```jsx
static #buildSecondaryButtons(photo, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto, canDelete, onDelete) {
  const buttons = [];
  if (canSetProfilePhoto && !isProfilePhoto) {
    buttons.push({
      label: Translator.t('photo_view_modal.set_profile_photo'),
      variant: 'primary',
      icon: Icons.postage,
      onClick: () => onSetProfilePhoto(photo.id),
    });
  }
  if (canDelete) {
    buttons.push({
      label: Translator.t('photo_card.delete_photo'),
      variant: 'danger',
      icon: Icons.trash,
      onClick: () => onDelete(photo.id),
    });
  }
  return buttons;
}
```

`Icons.trash` already resolves to `'bi-trash-fill'` — exactly the icon the issue asks for, no new icon constant needed. Note `ActionBar` supports at most 2 `secondaryButtons` (two fixed position classes) — set-profile-photo and delete can coexist (2 buttons) only when the photo isn't already the profile photo; verify this against `ActionBar.jsx`'s actual button-position styling when implementing, and adjust layout if 2 buttons overlap visually.

### Step 8 — Thread `canDelete`/`onDelete` through to `PhotoCard`

`frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx` — where `PhotoCard` is rendered per photo, add:

```jsx
<PhotoCard
  key={photo.id}
  photo={photo}
  alt={alt}
  onClick={handlers.onSelectPhoto}
  canSetProfilePhoto={canSetProfilePhoto}
  isProfilePhoto={photo.id === profilePhotoId}
  onSetProfilePhoto={handlers.onSetProfilePhoto}
  canDelete={canDeletePhoto}
  onDelete={handlers.onDelete}
/>
```

(`canDeletePhoto` passed down from `character.can_delete_photo`, same as `canSetProfilePhoto` is passed from `character.can_set_profile_photo` today.)

### Step 9 — `PhotoViewModal` consistency (judgment call)

`PhotoViewModal` already supports `onSetProfilePhoto`/`canSetProfilePhoto` for the same photo shown full-size. For UI consistency, add the same delete button there too (reusing the same handler chain) — confirm with a quick look at the actual component before deciding whether it's in scope for this issue or a natural follow-up; the issue itself only specifies the button on the card.

### Step 10 — Tests

New Jasmine specs mirroring existing conventions:
- `frontend/specs/assets/js/components/resources/character/pages/elements/DeletePhotoConfirmModalSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/DeletePhotoConfirmModalHelperSpec.js`
- `frontend/specs/assets/js/components/common/base/controllers/PhotoDeleteSagaSpec.js` (mirror `PhotoUploadSagaSpec.js`'s spy-based style)
- `frontend/specs/assets/js/client/BaseClientSpec.js` — extend with `deleteJson` coverage, if such a spec file exists.
- `frontend/specs/assets/js/utils/requests/RequestMutationClientSpec.js` — extend with a `DELETE` case.
- Extend `PhotoCardHelperSpec.js`/`PhotoCardSpec.js` for the new `canDelete`/`onDelete` button.
- Extend the `CharacterPhotos` page spec for the new modal wiring.

## Files to Change
- `frontend/assets/js/client/BaseClient.js` — new `deleteJson`.
- `frontend/assets/js/utils/requests/RequestMutationClient.js` — `DELETE` writer.
- `frontend/assets/js/utils/requests/config/pcConfig.js`, `npcConfig.js` — new `photoDelete` entry.
- `frontend/assets/js/components/common/base/controllers/PhotoDeleteSaga.js` — new.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js` — new `deletePhoto` method.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — new state/handlers, render new modal.
- `frontend/assets/js/components/resources/character/pages/elements/DeletePhotoConfirmModal.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/DeletePhotoConfirmModalHelper.jsx` — new.
- `frontend/assets/js/components/common/cards/PhotoCard.jsx` — new props.
- `frontend/assets/js/components/common/cards/helpers/PhotoCardHelper.jsx` — new button.
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx` — thread new props.
- New/extended spec files listed in Step 10.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until `translator.md`'s keys land in every locale file.

## Notes
- `RequestMutationClient`/`RequestStore` have never issued a `DELETE` before — this is new infrastructure, not just a new config entry; double check `RequestStore.mutate`'s call sites don't assume a request body is always present (DELETE here needs no body).
- `permission: 'can_delete_photo'` in the resource config is a client-side gating string mirroring the `photoSet`/`can_edit` precedent — actual enforcement is server-side via `CharacterPhotoDeletePermission`; a mismatch here is a UX-only bug, not a security one.
