# Frontend Plan: Add Game Item photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new endpoint from `plan.md`: `POST /games/:game_slug/items/:item_id/photo_upload.json`
— call it exactly like `TreasuresHelper.jsx`/`CharacterDetail.jsx` already do, via
`PhotoUploadModal`'s `uploadPath` prop; no bespoke fetch logic needed. The finalize
(`PATCH /uploads/:id.json`) step is already fully generic and handled inside
`PhotoUploadModal`/`PhotoUploadModalController`/`UploadClient` — nothing new to build there.

Implements the "who can upload" half of `plan.md`'s authorization formula **on the frontend**,
independently of the backend's `GameItemPhotoUploadPermission` (the backend still enforces it
authoritatively; this is only for hiding/showing the button): `is_superuser || is_staff ||
is_dm || is_player`, sourced from `AccessStore.ensureGameAccess(gameSlug)`'s payload
(`is_superuser`, `is_staff`, `is_dm`, `is_player` fields — the same shape already consumed
elsewhere via `AccessStoreAccess`). This is deliberately **not** the same flag
`GameItemController` already computes (`can_edit`, from `ensureGamePermissions`) — that one is
narrower (dm/staff/superuser only, used to pick between `items/:id.json` and
`items/:id/all.json`) and does not include `is_player`, so it under-grants for this feature.

## Implementation Steps

### Step 1 — Extend `GameItemController`

`frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js`
currently only calls `AccessStore.ensureGamePermissions` for the narrow `can_edit` gate. Add a
second, independent call to `AccessStore.ensureGameAccess(gameSlug)` in `#loadItem` (parallel
to the existing `ensureGamePermissions` call, not chained after it — both can resolve
concurrently) to derive a `canUploadPhoto` boolean using the formula above, and expose it
alongside `item`/`loading`/`error` via a new setter (`setCanUploadPhoto`) passed into the
constructor, mirroring how `setItem`/`setLoading`/`setError` already work. Fail-closed
(`false`) on a rejected access check, matching the existing `.catch(() => false)` pattern for
`can_edit`.

### Step 2 — Wire the modal into `GameItem.jsx`

`frontend/assets/js/components/resources/item/pages/GameItem.jsx` currently calls
`ItemDetailHelper.render(item, backHref)` with no handlers at all. Rework it to match
`CharacterDetail.jsx`'s shape:
- Add `showUploadModal` state and a `canUploadPhoto` state (populated by the controller change
  in Step 1).
- Render `<PhotoUploadModal show={showUploadModal} uploadPath={\`/games/${gameSlug}/items/${item.id}/photo_upload.json\`} onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />` alongside the existing `ItemDetailHelper.render(...)` call, where
  `handleUploadSuccess` closes the modal and re-triggers `controller.buildEffect()()` (same
  pattern as `CharacterDetail.jsx`'s `handleUploadSuccess`) so the newly uploaded `photo_path`
  shows immediately.
- Pass `ItemDetailHelper.render(item, backHref, canUploadPhoto, () => setShowUploadModal(true))`
  — see Step 3 for the new parameter shape.

### Step 3 — Extend `ItemDetailHelper` without breaking `CharacterItem`

`ItemDetailHelper` is shared by `GameItem`, `PcCharacterItem`, and `NpcCharacterItem`
(`CharacterItem.jsx`) — per this issue's scope decision, `CharacterItem` photo upload stays
out of scope, so its two callers must keep behaving exactly as today. Change
`ItemDetailHelper.render`'s signature to accept two new **optional** parameters defaulting to
today's hardcoded values, so `CharacterItem.jsx` (which will keep calling
`ItemDetailHelper.render(item, backHref)` unmodified) is unaffected:

```js
static render(item, backHref, canEdit = false, onUploadClick = Noop.noop) {
  // ...
  <ActionsOverlay
    type="item"
    url={item.photo_path}
    alt={item.name}
    canEdit={canEdit}
    onClick={onUploadClick}
    infoBarItems={ItemCardHelper.buildInfoBarItems(item, Translator.t('item_page.hidden_label'))}
  />
  // ...
}
```

Only `GameItem.jsx` passes real values (Step 2); `CharacterItem.jsx` is untouched and keeps
getting `canEdit={false}`/`onClick={Noop.noop}` via the new defaults.

### Step 4 — Specs

- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js`:
  add cases for the new `ensureGameAccess` call and the `canUploadPhoto` formula (true for
  staff/dm/player/superuser, false for an unrelated authenticated user or a rejected access
  check).
- `frontend/specs/assets/js/components/resources/item/pages/GameItemSpec.js`: assert
  `PhotoUploadModal` renders with the correct `uploadPath`, that clicking the overlay's edit
  button opens it (when `canUploadPhoto` is true), and that a successful upload re-fetches the
  item.
- `frontend/specs/assets/js/components/resources/item/pages/helpers/ItemDetailHelperSpec.js`:
  assert the new optional params default to the old disabled behavior when omitted (covers the
  `CharacterItem.jsx` callers implicitly) and are honored when passed.
- Confirm the existing `CharacterItem`-related specs still pass unmodified — no new assertions
  needed there, just a regression check.

## Files to Change

- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` —
  add the `ensureGameAccess` call and `canUploadPhoto` derivation/setter.
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` — upload modal state,
  `PhotoUploadModal` render, pass new params to `ItemDetailHelper.render`.
- `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx` — new
  optional `canEdit`/`onUploadClick` params with backward-compatible defaults.
- Corresponding spec files under `frontend/specs/` for the three files above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, "Check
  JS Lint" step)

## Notes

- No new i18n keys needed — `photo_upload_modal.*` in `frontend/assets/i18n/{en,pt}.yaml` is
  already fully generic and reused as-is by Treasure/Character; confirmed no
  per-resource-specific upload-modal copy exists anywhere else.
