# Frontend Plan: Add upload photo to character edit page

Main plan: [plan.md](plan.md)

## Shared contracts

This work depends on the translator agent adding two new translation keys, referenced via
`Translator.t()`:

- `pc_edit_page.upload_photo_button`
- `npc_edit_page.upload_photo_button`

These must exist in every locale file (`en.yaml`, `pt.yaml`) before the `check_i18n` /
`frontend-checks` CI job passes. No other contract crosses an agent boundary.

## Implementation Steps

### Step 1 — Generalize `UploadClient.initUpload` to a generic upload path

Today `initUpload(gameSlug, filename, token)` hard-codes
`` `/games/${gameSlug}/photo_upload.json` ``. Change its first parameter to a full path
(e.g. rename to `path`) and POST directly to it:

```js
initUpload(path, filename, token) {
  return this.request(path, { ... });
}
```

Callers now build the correct path for the target they're uploading to (game vs. PC vs.
NPC). `submitUpload` is unaffected — it's already generic (`/uploads/:id/submit`).

Update `frontend/specs/assets/js/client/UploadClientSpec.js` accordingly (assert the exact
path is used verbatim, add a case for a character-shaped path such as
`/games/my-game/pcs/7/photo_upload.json`).

### Step 2 — Generalize `PhotoUploadModal` and its controller

- `PhotoUploadModalController.handleSubmit(gameSlug, file, token)` currently forwards
  `gameSlug` straight into `client.initUpload`. Rename the parameter to `uploadPath` (or
  similar) — behavior is otherwise unchanged, it just passes through.
- `PhotoUploadModal.jsx` currently takes a `gameSlug` prop and passes it to
  `controller.handleSubmit(gameSlug, file, token)`. Rename this prop to `uploadPath` (a
  full path string, e.g. `/games/epic-quest/photo_upload.json` or
  `/games/epic-quest/pcs/7/photo_upload.json`), computed by the caller.
- Update `GameEdit.jsx` to pass
  `uploadPath={`/games/${gameSlug}/photo_upload.json`}` instead of `gameSlug={gameSlug}`.

Update `PhotoUploadModalControllerSpec.js` and `PhotoUploadModalSpec.js` to match the
renamed parameter/prop, and `GameEditSpec.js`/`GameEditHelperSpec.js` if they assert on the
old prop name.

### Step 3 — Let `PcCharacterEdit`/`NpcCharacterEdit` tell the shared page which endpoint segment to use

`CharacterEdit.jsx` is shared between PC and NPC pages but has no notion of "pcs" vs
"npcs" in the URL. Add a new prop, e.g. `characterKind` (`'pcs'` or `'npcs'`), passed down
from `PcCharacterEdit.jsx` (`characterKind="pcs"`) and `NpcCharacterEdit.jsx`
(`characterKind="npcs"`).

### Step 4 — Wire the upload modal into `CharacterEdit.jsx`

Mirror `GameEdit.jsx`:
- Add `const [showUploadModal, setShowUploadModal] = useState(false);`.
- Compute `` const uploadPath = `/games/${gameSlug}/${characterKind}/${characterId}/photo_upload.json`; ``.
- Pass `onOpenUploadModal: () => setShowUploadModal(true)` into the handlers object given to
  `EditHelper.render`.
- Render `<PhotoUploadModal show={showUploadModal} uploadPath={uploadPath} onClose={() => setShowUploadModal(false)} onSuccess={() => setShowUploadModal(false)} />` alongside the helper output (same no-refresh-after-success behavior as the game edit page — do not re-fetch the character or update `avatarUrl`/`profile_photo_path` locally).

### Step 5 — Add the upload button to the shared character edit form

In `BaseCharacterEditHelper.render` (`frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`),
add a button next to/below the `avatar_url` `FormField`, mirroring `GameEditHelper`:

```jsx
<button
  className="btn btn-secondary"
  type="button"
  onClick={handlers.onOpenUploadModal}
>
  {Translator.t(`${i18nNamespace}.upload_photo_button`)}
</button>
```

Keep the existing `avatar_url` field as-is — both coexist, same as the game edit page.

### Step 6 — Update/add specs

- `BaseCharacterEditHelperSpec.js` — assert the new button renders and calls
  `handlers.onOpenUploadModal`.
- `CharacterEditSpec.js` — assert the modal is rendered with the right `uploadPath` for a
  given `characterKind`/`gameSlug`/`characterId`, and that success/close both hide it
  without refetching the character.
- `PcCharacterEditSpec.js` / `NpcCharacterEditSpec.js` — assert `characterKind` is passed
  down correctly (`'pcs'` / `'npcs'`).
- Update any spec asserting the old `PhotoUploadModal` `gameSlug` prop name (see Step 2).

### Step 7 — Run the full frontend dev cycle locally

```bash
docker-compose run majora_fe yarn lint
docker-compose run majora_fe yarn coverage
docker-compose run majora_fe yarn check_i18n
```

The last command will only pass once the translator agent's keys are in place.

## Files to Change

- `frontend/assets/js/client/UploadClient.js` — generalize `initUpload` to take a full path
- `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js` — rename `gameSlug` param to `uploadPath`
- `frontend/assets/js/components/elements/PhotoUploadModal.jsx` — rename `gameSlug` prop to `uploadPath`
- `frontend/assets/js/components/pages/GameEdit.jsx` — pass `uploadPath` instead of `gameSlug`
- `frontend/assets/js/components/pages/PcCharacterEdit.jsx` — pass `characterKind="pcs"`
- `frontend/assets/js/components/pages/NpcCharacterEdit.jsx` — pass `characterKind="npcs"`
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — add upload modal state/wiring, accept `characterKind` prop
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — add upload button
- `frontend/specs/assets/js/client/UploadClientSpec.js`
- `frontend/specs/assets/js/components/elements/PhotoUploadModalSpec.js`
- `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js`
- `frontend/specs/assets/js/components/pages/GameEditSpec.js` (if it references the renamed prop)
- `frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js`
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js`
- `frontend/specs/assets/js/components/pages/PcCharacterEditSpec.js`
- `frontend/specs/assets/js/components/pages/NpcCharacterEditSpec.js`

## CI Checks

- `frontend`: `docker-compose run majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- No proxy or backend changes are needed — the PC/NPC upload endpoints already exist and
  the proxy upload rules are already generic (per the issue description).
- Do not auto-refresh the avatar preview after a successful upload, matching current game
  edit page behavior (this may be revisited in a future issue).
- Renaming `gameSlug` → `uploadPath` on `PhotoUploadModal`/`PhotoUploadModalController` is a
  small breaking change local to this component tree; there are no other consumers besides
  `GameEdit.jsx` and the new character edit wiring, so this is safe.
