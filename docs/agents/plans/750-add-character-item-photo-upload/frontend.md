# Frontend Plan: Add Character Item Photo Upload

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new endpoints from `plan.md`:
`POST /games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json` and the `/npcs/`
equivalent — call it exactly like `CharacterDetail.jsx` already does for the character's own
photo, via `PhotoUploadModal`'s `uploadPath` prop; no bespoke fetch logic needed. The finalize
(`PATCH /uploads/:id.json`) step is already fully generic and handled inside
`PhotoUploadModal`/`PhotoUploadModalController`/`UploadClient` — nothing new to build there.

Implements the "who can upload" half of `plan.md`'s authorization formula **on the frontend**,
sourced from the new `can_upload_item_photo` field on `.../permissions.json`
(`AccessStore.ensureCharacterPermissions`) — the backend still enforces it authoritatively; this
is only for hiding/showing the button.

**Depends on #749's frontend change landing first**: `ItemDetailHelper.render`'s signature gains
optional `canEdit`/`onUploadClick` params in #749 (defaulting to `false`/`Noop.noop`, matching
today's disabled behavior), so `CharacterItem.jsx` can start passing real values without
affecting `GameItem.jsx`. If #749 hasn't merged yet when this is implemented, add that signature
change here instead — see #749's `frontend.md` Step 3 for its exact shape.

## Implementation Steps

### Step 1 — Extend `CharacterItemDetailController`

`frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js`
already calls `AccessStore.ensureCharacterPermissions(this.characterKind, params.game_slug, params.character_id)`
in `#loadItem` to derive `canEdit` (picking between `items/:id.json` and `items/:id/all.json`).
Read the new `can_upload_item_photo` field off that same resolved `permissions` object (no
second network call needed) and expose it alongside `item`/`loading`/`error` via a new setter
(`setCanUploadPhoto`) passed into the constructor, mirroring how `setItem`/`setLoading`/
`setError` already work. Fail-closed (`false`) on a rejected permissions check, matching the
existing `.catch(() => false)` pattern.

### Step 2 — Wire the modal into `CharacterItem.jsx`

`frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx` currently
calls `ItemDetailHelper.render(item, backHref)` with no handlers. Rework it to match
`CharacterDetail.jsx`'s shape:
- Add `showUploadModal` state and a `canUploadPhoto` state (populated by the controller change
  in Step 1).
- Render `<PhotoUploadModal show={showUploadModal} uploadPath={\`/games/${gameSlug}/${characterKind}/${characterId}/items/${item.id}/photo_upload.json\`} onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />` alongside the existing `ItemDetailHelper.render(...)` call, where
  `handleUploadSuccess` closes the modal and re-triggers `controller.buildEffect()()` (same
  pattern as `CharacterDetail.jsx`'s `handleUploadSuccess`) so the newly uploaded `photo_path`
  shows immediately. `characterId` is already available in this component via
  `CharacterItemDetailController.getParamsFromHash`.
- Pass `ItemDetailHelper.render(item, backHref, canUploadPhoto, () => setShowUploadModal(true))`
  — the same optional-params shape #749 adds to `ItemDetailHelper` (see this plan's "Shared
  contracts" note on the #749 dependency). `GameItem.jsx`'s own call is untouched by this issue.

### Step 3 — Specs

- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterItemDetailControllerSpec.js`:
  add cases for reading `can_upload_item_photo` off the existing `ensureCharacterPermissions`
  resolution and the `canUploadPhoto` setter (true/false passthrough, false on a rejected check).
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterItemSpec.js`:
  assert `PhotoUploadModal` renders with the correct per-kind `uploadPath` (PC and NPC cases),
  that clicking the overlay's edit button opens it (when `canUploadPhoto` is true), and that a
  successful upload re-fetches the item.
- Confirm `GameItemSpec.js` and `ItemDetailHelperSpec.js` (both touched by #749) still pass
  unmodified — no new assertions needed there, just a regression check.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js`
  — read `can_upload_item_photo` from the existing permissions call, add the setter.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx` — upload
  modal state, `PhotoUploadModal` render, pass new params to `ItemDetailHelper.render`.
- Corresponding spec files under `frontend/specs/` for the two files above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, "Check
  JS Lint" step)

## Notes

- No new i18n keys needed — `photo_upload_modal.*` in `frontend/assets/i18n/{en,pt}.yaml` is
  already fully generic and reused as-is by Treasure/Character/GameItem.
- `PcCharacterItem.jsx`/`NpcCharacterItem.jsx` need no changes — both just instantiate the shared
  `CharacterItem` component with a `characterKind` prop, which already flows through to the new
  upload path.
