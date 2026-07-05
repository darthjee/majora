# Frontend Plan: Add NPC slain

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the new `PATCH /games/<slug>/npcs/<id>/slain.json` endpoint
  (body `{"slain": true|false}`, response `{"slain": true|false}`).
- `slain` is now present on every character list/detail item
  (`character.slain`, boolean) — including PCs, where it is always `false`
  in practice.
- Needs new translation keys from the `translator` agent (see
  `translator.md`) — reference via `Translator.t('<key>')`, do not hardcode
  strings. The existing `photo_upload_modal.title` key is reused unchanged
  for the "Upload Photo" button label.

## Implementation Steps

### Step 1 — `CharacterClient.setNpcSlain`

Add to `frontend/assets/js/client/CharacterClient.js`, mirroring
`setNpcPhotoRoles`:

```js
/**
 * Sets the slain flag on an NPC character.
 *
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {string|number} characterId - Character id.
 * @param {string|null} token - Authentication token, if any.
 * @param {boolean} slain - Desired slain state.
 * @returns {Promise<Response>} fetch response from the slain endpoint.
 */
setNpcSlain(gameSlug, characterId, token, slain) {
  return this.request(`/games/${gameSlug}/npcs/${characterId}/slain.json`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({ slain }),
  });
}
```

### Step 2 — CSS: grayscale + left/right overlay buttons

In `frontend/assets/css/main.scss`:

- Add a `.photo-grayscale img { filter: grayscale(100%); }` rule (scoped to
  `.card-photo-square img`/avatar images), applied via a class toggled by the
  `grayscale` prop below.
- Extend `.photo-upload-overlay`: keep the existing centered
  `.photo-upload-overlay-button` behavior as the default (unchanged, so
  `Game.jsx`/`TreasureCard`/`BaseCharacterEditHelper`/`GameEditHelper` are
  unaffected), and add two new modifier classes,
  `.photo-upload-overlay-button-left` and `.photo-upload-overlay-button-right`
  (same `position: absolute; bottom: 0.5rem;` base, `left: 0.5rem;` /
  `right: 0.5rem;` instead of centered `transform: translateX(-50%)`), used
  only when a second button is present.

### Step 3 — Extend `PhotoUploadOverlay`

`frontend/assets/js/components/elements/PhotoUploadOverlay.jsx` gains two new
optional props, both defaulting to "off" so every existing call site
(`Game.jsx`, `TreasureCardHelper.jsx`, `BaseCharacterEditHelper.jsx`,
`GameEditHelper.jsx`) is unaffected:

- `grayscale` (boolean, default `false`) — passed down to the underlying
  `Photo` wrapper's className (e.g. `photo-upload-overlay${grayscale ? ' photo-grayscale' : ''}`).
- `secondaryButton` (`{ label: string, variant: string, onClick: Function }`,
  optional) — when present, render the primary upload button with the
  `-left` modifier class and a second `<button>` with the `-right` modifier
  class, `btn-{variant}` (e.g. `btn-danger` for "Slain", `btn-success` for
  "Revive"), `onClick={secondaryButton.onClick}`. When absent, the primary
  button keeps its current centered class exactly as today.

Update `PhotoUploadOverlaySpec.js` for both new props (grayscale class
present/absent; secondaryButton rendered/not rendered, correct classes and
click handler wired).

### Step 4 — `SlainConfirmModal` (mirrors `PhotoUploadModal`)

Add, following the exact component/helper/controller split of
`PhotoUploadModal`/`PhotoUploadModalHelper`/`PhotoUploadModalController`:

- `frontend/assets/js/components/elements/SlainConfirmModal.jsx` — props
  `{ show, slain, onConfirm, onCancel }` (`slain` is the *current* state,
  used to pick title/body copy and the confirm button's label/variant —
  "Mark as Slain" / red when currently alive, "Revive" / green when
  currently slain). No file/upload state needed — this is a pure
  confirm/cancel dialog, simpler than `PhotoUploadModal`.
- `frontend/assets/js/components/elements/helpers/SlainConfirmModalHelper.jsx`
  — renders the `react-bootstrap` `Modal` with title/body/Cancel/Confirm,
  same structural pattern as `PhotoUploadModalHelper`.
- No dedicated controller class is needed since there is no async
  upload/error/progress state to manage beyond a single confirm click; the
  parent page owns the fetch call (see Steps 5–6) and passes `onConfirm` in,
  matching how `PhotoViewModal` (no controller) already works elsewhere in
  this codebase. If, during implementation, shared logic emerges that
  would otherwise be duplicated across the NPC show page and NPC index
  page, factor it into a small controller then — do not force one
  prematurely.

Add specs mirroring `PhotoUploadModalHelperSpec`/`PhotoUploadModalSpec`.

### Step 5 — NPC show page (`NpcCharacter.jsx` / `CharacterHelper.jsx`)

`CharacterHelper.jsx` is shared between `PcCharacter.jsx` and
`NpcCharacter.jsx`. Update `CharacterHelper.render`:

- Always pass `grayscale={character.slain}` to `PhotoUploadOverlay` (a no-op
  for PCs, since `character.slain` is always `false` there).
- Only when `!character.is_pc` (NPC) **and** `character.can_edit`, also pass
  `secondaryButton` (label/variant/onClick derived from `character.slain`,
  built from a new `handlers.onOpenSlainModal` callback — extend the
  `handlers` param, mirroring the existing `handlers.onOpenUploadModal`).

`NpcCharacter.jsx`:
- Add `const [showSlainModal, setShowSlainModal] = useState(false);`.
- Pass `onOpenSlainModal: () => setShowSlainModal(true)` into
  `CharacterHelper.render`'s `handlers` argument.
- Render `<SlainConfirmModal show={showSlainModal} slain={character.slain} onCancel={() => setShowSlainModal(false)} onConfirm={handleConfirmSlain} />`
  where `handleConfirmSlain` calls
  `new CharacterClient().setNpcSlain(gameSlug, character.id, AuthStorage.getToken(), !character.slain)`,
  then on success closes the modal and calls `controller.buildEffect()()` to
  refetch the character (so `slain`/grayscale update immediately).

`PcCharacter.jsx` needs no change — `CharacterHelper.render`'s NPC-only
branch simply never fires for it.

### Step 6 — NPC index cards (`GameNpcs.jsx` / `CharacterCard*` / `GameCharactersHelper.jsx`)

`CharacterCard.jsx` / `CharacterCardHelper.jsx` gain new optional props,
meaningful only when `characterType === 'npc'`:

- `canEdit` (boolean, default `false`).
- `onUploadClick` / `onSlainClick` (`Function`, called with the character
  object).

When `characterType === 'npc'`, render the photo via `PhotoUploadOverlay`
(`type="avatar"`, `grayscale={character.slain}`, upload button gated by
`canEdit` via `onClick={onUploadClick}`, `secondaryButton` gated by
`canEdit` via `onClick={onSlainClick}`) instead of the bare `CardAvatar`
used today. When `characterType === 'pc'`, keep today's plain `CardAvatar`
rendering unchanged (no overlay buttons — out of scope per the issue), but
still fine to receive `slain` on the character object (always `false`).

**Important:** the whole card is wrapped in an `<a href=...>` (navigates to
the detail page). The overlay buttons render *inside* that anchor, so their
`onClick` handlers must call `event.preventDefault(); event.stopPropagation();`
before invoking `onUploadClick`/`onSlainClick`, otherwise clicking them will
also navigate away. Verify this with a Jasmine spec (simulate a click and
assert the anchor's navigation was prevented / the handler is called
exactly once).

`GameCharactersHelper.render` gains optional `canEdit = false`,
`onUploadClick = Noop.noop`, `onSlainClick = Noop.noop` params, forwarded to
`CharacterCard` **only** when `characterType === 'npc'` (the PC call site,
`GamePcs.jsx`, keeps calling `render()` with its existing arguments
unchanged and is therefore unaffected).

`GameNpcs.jsx`:
- Reuse the `canEdit` state it already fetches (via `GameClient.fetchGameAccess`,
  currently only used to gate the "New NPC" button) as the per-card
  `canEdit` value — this matches `CharacterEditPermission`'s effective
  behavior for NPCs (superuser or DM; NPCs have no player in practice, per
  the product-owner review referenced in `plan.md`).
- Add `const [uploadTarget, setUploadTarget] = useState(null);` and
  `const [slainTarget, setSlainTarget] = useState(null);` (both hold a
  character object or `null`).
- Pass `onUploadClick={setUploadTarget}` and `onSlainClick={setSlainTarget}`
  into `GameCharactersHelper.render(...)`.
- Render `<PhotoUploadModal show={uploadTarget !== null} uploadPath={`/games/${gameSlug}/npcs/${uploadTarget?.id}/photo_upload.json`} onClose={() => setUploadTarget(null)} onSuccess={handleUploadSuccess} />`
  (closes modal + refetches NPC list on success) and
  `<SlainConfirmModal show={slainTarget !== null} slain={slainTarget?.slain} onCancel={() => setSlainTarget(null)} onConfirm={handleConfirmSlain} />`
  where `handleConfirmSlain` calls `characterClient.setNpcSlain(gameSlug, slainTarget.id, token, !slainTarget.slain)`,
  then closes the modal and calls `controller.buildEffect()()` to refetch
  the NPC list.

### Step 7 — Specs

Add/update Jasmine specs for every touched or new file, mirroring existing
naming/location conventions under `frontend/specs/...`:
`CharacterClientSpec` (`setNpcSlain`), `PhotoUploadOverlaySpec`,
`SlainConfirmModalSpec`/`SlainConfirmModalHelperSpec`, `CharacterCardSpec`/
`CharacterCardHelperSpec`, `GameCharactersHelperSpec`, `CharacterHelperSpec`,
`NpcCharacterSpec`, `GameNpcsSpec` (or their controller/helper equivalents).
Cover: grayscale class present when `slain: true`; Slain/Revive button only
rendered for NPCs with edit rights; button click opens the confirm modal
without navigating; confirming calls the client with the flipped `slain`
value and refetches.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `setNpcSlain`
- `frontend/assets/css/main.scss` — grayscale + left/right overlay button classes
- `frontend/assets/js/components/elements/PhotoUploadOverlay.jsx` — `grayscale`/`secondaryButton` props
- `frontend/assets/js/components/elements/SlainConfirmModal.jsx` — new
- `frontend/assets/js/components/elements/helpers/SlainConfirmModalHelper.jsx` — new
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — grayscale + NPC-only secondary button
- `frontend/assets/js/components/pages/NpcCharacter.jsx` — slain modal wiring
- `frontend/assets/js/components/elements/CharacterCard.jsx` — new props passthrough
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — NPC overlay rendering
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` — forward new props for NPC only
- `frontend/assets/js/components/pages/GameNpcs.jsx` — upload/slain target state + modals
- New/updated spec files mirroring every file above, under `frontend/specs/...`

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm frontend npm run lint` (CI job: `checks`)
- `frontend/`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`) — will fail until the `translator` agent's keys land in every locale file.

## Notes

- Do not change `GamePcs.jsx` or its call to `GameCharactersHelper.render` —
  PCs never get the upload/slain overlay buttons.
- Coordinate with `translator.md` for exact key names before wiring
  `Translator.t()` calls in `SlainConfirmModalHelper.jsx` and the new
  button label, to avoid churn.
- `data-access`/`security` review applies to the backend/proxy changes, not
  directly to this frontend work, but keep an eye out in case either review
  surfaces a frontend-visible consequence (e.g. a response shape change).
