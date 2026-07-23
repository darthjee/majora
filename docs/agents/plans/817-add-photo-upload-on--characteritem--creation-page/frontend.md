# Frontend Plan: Add photo upload on `CharacterItem` Creation page

Main plan: [plan.md](plan.md)

## Shared contracts

Must call `Translator.t('character_item_new_page.photo_upload_failed')`,
`.retry_photo_upload`, and `.skip_photo_upload` from the new failed-upload alert component —
the translator agent adds these keys to both `en.yaml` and `pt.yaml`.

## Implementation Steps

### Step 1 — Extract the create-then-upload saga into a shared helper

The two-step upload flow (`UploadClient#initUpload` then `#submitUpload`) is currently inlined
in `GameNpcNewController#uploadPhoto`
(`frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js`,
lines 189-213). Extract it so `CharacterItemNewController` can reuse it instead of duplicating
the logic.

- New file `frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js`,
  alongside `BasePageController.js`/`BaseEditController.js` (the existing home for shared
  controller behavior). A plain class (not a `Base*Controller` subclass, since it's used via
  composition, not inheritance):

  ```js
  export default class PhotoUploadSaga {
    constructor(uploadClient = null) {
      this.uploadClient = uploadClient ?? new UploadClient();
    }

    async upload(uploadPath, photoFile, token) {
      try {
        const initResponse = await this.uploadClient.initUpload(uploadPath, photoFile.name, token);
        if (!initResponse.ok) return false;

        const { upload_id: uploadId, token: uploadToken } = await initResponse.json();
        const submitResponse = await this.uploadClient.submitUpload(uploadId, uploadToken, photoFile);

        return submitResponse.ok;
      } catch {
        return false;
      }
    }
  }
  ```

- Update `GameNpcNewController`: keep the existing `uploadClient` constructor param
  (so existing specs that stub `initUpload`/`submitUpload` on it keep working unchanged),
  but build `this.photoUploadSaga = new PhotoUploadSaga(this.uploadClient)` and rewrite
  `#uploadPhoto` to:

  ```js
  async #uploadPhoto(gameSlug, characterId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = `/games/${gameSlug}/npcs/${characterId}/photo_upload.json`;
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      this.#redirectToNpc(gameSlug, characterId);
      return;
    }

    this.#failPhotoUpload(characterId, setters);
  }
  ```

  `submitForm`, `retryPhotoUpload`, and the public constructor signature are unchanged.

### Step 2 — Add the item photo picker to the shared `item` show-type config

`frontend/assets/js/components/resources/item/pages/elements/show/ItemPhoto.jsx` currently
only defines `Show`/`Edit` variants (lines 20-67), with a comment stating there is no `New`
variant. Add one, mirroring `CharacterAvatarSlot`'s `CharacterAvatarEditOrNew`
(`frontend/assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx`,
lines 31-42):

```jsx
function ItemPhotoNew({
  photo_path: photoPath, name, hidden, handlers,
}) {
  return (
    <ActionsOverlay
      type="item"
      url={photoPath}
      alt={name}
      canEdit
      onClick={handlers.onOpenUploadModal}
      dimmed={hidden}
    />
  );
}

const ItemPhoto = { Show: ItemPhotoShow, Edit: ItemPhotoEdit, New: ItemPhotoNew };
```

Update the file's doc comments (lines 10-19 and 62-66) — they currently assert item creation
has no photo affordance. `frontend/assets/js/components/common/show_page/show_types/configs/itemShowType.js`
needs no structural change (`ItemPhoto` is already referenced directly in the `left` array, so
adding the `New` key wires it in automatically for `mode="new"`) — just update its stale doc
comment (lines 20-22).

### Step 3 — Wire deferred photo picking into the creation page

`frontend/assets/js/components/resources/character/pages/shared/CharacterItemNew.jsx`
currently has no photo state at all. Mirror `GameNpcNew.jsx` (lines 23-58, 111-119):

- Add `photoFile`/`showUploadModal`/`gameItemId` state (`gameItemId` is new — needed for
  `retryPhotoUpload`, since the upload target is the `GameItem` id, not the character id).
- Add the `photoPreviewUrl` memo + revoke-on-change effect, identical to `GameNpcNew.jsx`
  lines 49-58.
- Render `<PhotoUploadModal show={showUploadModal} deferred onFileConfirmed={(file) => { setPhotoFile(file); setShowUploadModal(false); }} onClose={() => setShowUploadModal(false)} />`.
- Pass `photo_path: photoPreviewUrl` and `hidden: fields.hidden` into the render context (the
  `ItemPhotoNew` slot added in Step 2 destructures those same keys `ItemPhotoShow`/`Edit`
  already use).
- Add `onOpenUploadModal`, `onRetryPhotoUpload`, `onSkipPhotoUpload` handlers. `onSkipPhotoUpload`
  navigates straight to `/games/${gameSlug}/${characterKind}/${characterId}/items` (there is no
  per-item page to land on), matching `GameNpcNew.jsx`'s `handleSkipPhotoUpload` pattern
  (lines 74-78) but targeting the items list instead of the NPC page.
- Pass `photoFile` through to `controller.submitForm(...)`.

`CharacterItemNewHelper.jsx`'s `render` already spreads `{...formState, handlers}` generically
into `ShowPageLayout`'s context, so no code change is needed there beyond its JSDoc.

### Step 4 — Update `CharacterItemNewController`

`frontend/assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js`:

- Constructor: add an optional `uploadClient` param and build
  `this.photoUploadSaga = new PhotoUploadSaga(uploadClient)`.
- `submitForm`: pass `formValues.photoFile` through to `#handleResponse`.
- `#handleResponse(response, gameSlug, characterId, photoFile, setters)`: on `201`, parse the
  response body (it currently discards it, lines 109-113) to read `game_item_id`. If
  `photoFile` was picked, call `#uploadPhoto(gameSlug, characterId, data.game_item_id, photoFile, setters)`;
  otherwise keep the existing `#redirectToItems(gameSlug, characterId)` behavior.
- New `#uploadPhoto(gameSlug, characterId, gameItemId, photoFile, setters)`:

  ```js
  async #uploadPhoto(gameSlug, characterId, gameItemId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = `/games/${gameSlug}/items/${gameItemId}/photo_upload.json`;
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      this.#redirectToItems(gameSlug, characterId);
      return;
    }

    setters.setGameItemId(gameItemId);
    setters.setStatus('photo-upload-failed');
  }
  ```

- New public `retryPhotoUpload(gameSlug, characterId, gameItemId, photoFile, setters)`,
  mirroring `GameNpcNewController#retryPhotoUpload`:
  `return this.#uploadPhoto(gameSlug, characterId, gameItemId, photoFile, setters);`

### Step 5 — Add the failed-upload alert

- New file
  `frontend/assets/js/components/resources/item/pages/elements/show/ItemNewPhotoUploadFailedAlert.jsx`,
  structurally identical to `NpcNewPhotoUploadFailedAlert.jsx`
  (`frontend/assets/js/components/resources/character/pages/elements/show/NpcNewPhotoUploadFailedAlert.jsx`),
  using the new `character_item_new_page.photo_upload_failed` / `.retry_photo_upload` /
  `.skip_photo_upload` keys and `onRetryPhotoUpload`/`onSkipPhotoUpload` handlers.
- Wire it into `ItemTitle`
  (`frontend/assets/js/components/resources/item/pages/elements/show/ItemTitle.jsx`): add a
  `handlers` prop and render the alert below the existing error alert when
  `mode === 'new' && status === 'photo-upload-failed'`:

  ```jsx
  export default function ItemTitle({ mode, status, handlers }) {
    return (
      <>
        <h1>{Translator.t(TITLE_KEYS[mode])}</h1>
        {status === 'error' && <ErrorAlert error={Translator.t(ERROR_KEYS[mode])} />}
        {mode === 'new' && status === 'photo-upload-failed' && (
          <ItemNewPhotoUploadFailedAlert handlers={handlers} />
        )}
      </>
    );
  }
  ```

  (`handlers` is already present in the merged `ShowPageLayout` context every other slot
  receives it from.)

### Step 6 — Tests

- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterItemNewController/`:
  add cases for creation with a photo (upload succeeds → redirects to items list), creation
  with a photo where the upload fails (`photo-upload-failed` status + `gameItemId` stored), and
  `retryPhotoUpload`. The existing no-photo case should keep passing unchanged.
- `frontend/specs/assets/js/components/resources/character/pages/CharacterItemNewSpec.js`: add
  cases for opening the upload modal, holding/previewing the picked file, submitting with a
  photo, and the retry/skip alert rendering + actions.
- New spec `frontend/specs/assets/js/components/common/base/controllers/PhotoUploadSagaSpec.js`
  covering init+submit success/failure/exception paths (extracted out of the existing
  `GameNpcNewController` upload-photo tests).
- Verify the existing `GameNpcNewController` specs
  (`frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcNewController/`)
  still pass unchanged after the extraction — they mock `initUpload`/`submitUpload` on the
  injected `uploadClient`, which `PhotoUploadSaga` wraps transparently.
- Add/update specs for `ItemPhoto`'s new `New` variant and `ItemTitle`'s new alert branch
  (locate existing spec files under
  `frontend/specs/assets/js/components/resources/item/pages/elements/show/`, if present, or
  add them alongside the other `Item*Spec.js` files there).

## Files to Change

- `frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js` — new shared
  create-then-upload saga helper.
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js` —
  use `PhotoUploadSaga` instead of inlined init/submit calls.
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemPhoto.jsx` — add `New`
  variant.
- `frontend/assets/js/components/common/show_page/show_types/configs/itemShowType.js` — update
  stale doc comment.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItemNew.jsx` — add
  photo state, preview, modal, and handlers.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js` —
  read `game_item_id`, add upload/retry saga steps.
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemNewPhotoUploadFailedAlert.jsx` —
  new failed-upload alert.
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemTitle.jsx` — render the
  new alert.
- Associated spec files under `frontend/specs/...` mirroring the paths above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`) —
  needed once the translator agent's new keys land.

## Notes

- No backend changes are needed: the `photo_upload` endpoint
  (`backend/games/views/games/game_item_photo_upload.py`) and the `game_item_id` field on
  `CharacterItemSerializer` (`backend/games/serializers/characters/character_item.py`) already
  exist (added by issue #750/#757).
- Open styling question, not blocking: `itemShowType.js`'s `right` column still places the
  `New`-mode `ItemHiddenField` inline with the other fields rather than under the photo in the
  left column (unlike the `Edit` mode, which already does put it there). Left as-is to minimize
  the diff; revisit if a design pass wants creation to fully match the edit layout.
