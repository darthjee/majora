# Frontend Plan: Fix permissions serializers

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes 4 new keys from the existing `permissions.json` endpoint response (already fetched via `AccessStore.getCharacterPermissions(...)`): `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `can_delete_photo` — same booleans previously read directly off the character detail/full response.
- The backend removes these 4 fields (and `can_edit`, already handled today) from the character detail/full JSON response — after this change, `character.can_edit_money` etc. would be `undefined` unless merged in from the permissions endpoint.

## Implementation Steps

### Step 1 — Extend `CharacterAccessResolver.merge()`

In `frontend/assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js`, extend `merge()` to also read `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `can_delete_photo` off the same `access`/permissions object it already reads `can_edit`/`is_staff` from, coercing each with `Boolean(...)` (same pattern as the existing `is_staff: Boolean(access.is_staff)`) so an unresolved/fail-closed cache read yields `false`, not `undefined`.

### Step 2 — Leave `AccessStorePermissions.js`'s shared default as-is

`frontend/assets/js/utils/access/store/AccessStorePermissions.js`'s `PERMISSIONS_DEFAULT = { can_edit: false }` is shared across `ensureGame`/`ensureCharacter`/`ensureTreasure`. Do not add the 4 character-only keys there — that would leak character-specific defaults into Game/Treasure's fail-closed default. Let `CharacterAccessResolver.merge()`'s `Boolean(...)` coercion (Step 1) supply the character-specific defaults instead. Only update this file's JSDoc `@returns` annotations for `ensureCharacter`/`getCharacter` to document the 4 extra keys now present on the resolved payload.

### Step 3 — Update specs

- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterAccessResolverSpec.js`: extend the existing `toEqual` exact-object assertion to include the 4 new keys, and add new spec cases for each mirroring the existing `can_edit`/`is_staff` coercion cases (present, missing, falsy-but-defined).
- `frontend/specs/assets/js/utils/access/store/AccessStorePermissionsSpec.js`: check whether it asserts the shape of `ensureCharacter`'s resolved payload and extend if so.
- No changes needed to component-level specs that set these fields directly on ad-hoc fixture props (`CharacterMoneySlotSpec.js`, `CharacterTreasuresSpec.js`, `CharacterDetailMoneySpec.js`, `CharacterEditPcAccessGuardSpec.js`, `CharacterPhotosSpec.js`, `CharacterDetailPhotoModalSpec.js`, `photosPreviewSpec.js`, `CharacterPhotosPreviewSlotSpec.js`, `moneyEditSpec.js`) — they test components in isolation via props, bypassing `CharacterAccessResolver`, so their contracts are unaffected by this change.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js` — merge the 4 new fields
- `frontend/assets/js/utils/access/store/AccessStorePermissions.js` — JSDoc only, no behavior change
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterAccessResolverSpec.js` — extend coverage
- `frontend/specs/assets/js/utils/access/store/AccessStorePermissionsSpec.js` — extend coverage if applicable

## CI Checks

- `frontend/`: `npm run coverage` (CI job: `jasmine`)
- `frontend/`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No production components (`CharacterMoneySlot.jsx`, `CharacterEdit.jsx`, `CharacterTreasures.jsx`, `CharacterDetail.jsx`, `CharacterPhotos.jsx`, `elements/show/CharacterPhotosPreviewSlot.jsx`, `utils/requests/config/pcConfig.js`/`npcConfig.js`) need edits themselves — they already read these fields off the merged `character` object; only the merge source changes.
- No new translation keys are introduced by this change, so `translator` has no work here.
