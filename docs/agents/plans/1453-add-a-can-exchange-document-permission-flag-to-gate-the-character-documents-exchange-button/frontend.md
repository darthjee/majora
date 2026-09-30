# Frontend Plan: Add a can_exchange_document permission flag to gate the character Documents exchange button

Main plan: [plan.md](plan.md)

## Shared contracts

- `GET /permissions/game_pc.json` and `GET /permissions/game_npc.json` gain a new boolean field
  `can_exchange_document`.
- Value: `true` for dm/admin (always), staff and player of the game; `false` for anonymous users,
  users outside the game, and the `?role=owner` simulation (owner is not in `regular.create`).
  Role-simulated requests (`?role=staff|player|owner`) follow the same dual path as every other
  flag on these endpoints.
- Roles must mirror `regular.create` in `game_pc_document/endpoints.yml` /
  `game_npc_document/endpoints.yml` (`staff`, `player`), the tier that gates the plain
  `documents/acquire.json` / `documents/remove.json` endpoints.
- The frontend reads it from the character permissions payload (`AccessStore.ensureCharacterPermissions`)
  and exposes it on the page-level character object as `character.can_exchange_document`
  (fail-closed: missing → `false`).

## Implementation Steps

### Step 1 — Surface `can_exchange_document` on the documents page's character
The Documents page loads its character through `CharacterContextController`, whose
`#mergeAccess` currently merges only `can_edit` and `game_can_edit`. It does **not** go through
`CharacterAccessResolver`, which is where `can_exchange_treasure` / `can_exchange_recipe` are
merged for the character show page. Wire the new flag through both:

- `CharacterContextController.js`: in `#mergeAccess`, keep the resolved
  `ensureCharacterPermissions` payload and merge `can_exchange_document:
  Boolean(permissions.can_exchange_document)` onto the published character. Keep failures
  fail-closed (`false`). Update the JSDoc.
- `CharacterAccessResolver.js`: add `can_exchange_document: Boolean(permissions.can_exchange_document)`
  and update the JSDoc, so the flag is available consistently wherever a character is resolved.
- `AccessStorePermissions.js`: add `can_exchange_document: boolean` to both character-permission
  `@returns` JSDoc blocks. Check that `PERMISSIONS_DEFAULT` stays fail-closed (a missing key
  reads as falsy).
- `RequestPermissionResolvers.js` needs no change. The document request config already resolves
  character permissions, and this flag only gates UI.
- Specs: `controllers/CharacterContextControllerSpec.js` (flag merged as true/false, and false when
  the permissions fetch fails), `controllers/CharacterAccessResolverSpec.js`, and
  `controllers/CharacterController/fetchAndMergeAccessSpec.js` where it enumerates merged flags.

### Step 2 — Gate the Exchange trigger on the Documents page
- `shared/CharacterDocuments.jsx`: add an exported `resolveDocumentExchangeButton(character)`
  returning `Boolean(character?.can_exchange_document)`, mirroring `CharacterRecipes.jsx`'s
  `resolveRecipeExchangeButton`. Pass `() => setShowExchangeModal(true)` to
  `CharacterDocumentsHelper.render` only when it is true, and `null` otherwise.
  `CharacterDocumentsHelper.#renderExchangeButton` already skips the button when the handler is
  null, so the helper is unchanged. Update the component JSDoc, which currently says the trigger is
  gated by `gameCanEdit`/`canEdit`. Keep `buildDocumentExchangeCharacter` as is, because
  `canEdit`/`gameCanEdit` still route the modal tabs to the `/all` variants.
- `shared/CharacterRecipes.jsx`: remove the "unlike the Documents page, which does not gate its
  button" wording from `resolveRecipeExchangeButton`'s JSDoc.
- Specs: `CharacterDocumentsSpec.js` — `resolveDocumentExchangeButton` true/false cases (including
  `null` character and `can_edit: true` without the flag), and the page rendering no Exchange button
  when the flag is false/missing (anonymous) and rendering it when true.
  `helpers/CharacterDocumentsHelperSpec.js` should already cover the null-handler case. Confirm
  it does.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterContextController.js` — merge the flag
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js` — merge the flag
- `frontend/assets/js/utils/access/store/AccessStorePermissions.js` — JSDoc
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocuments.jsx` — gate the trigger
- `frontend/assets/js/components/resources/character/pages/shared/CharacterRecipes.jsx` — JSDoc wording only
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterContextControllerSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterAccessResolverSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/fetchAndMergeAccessSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/CharacterDocumentsSpec.js`

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` and the Jasmine coverage run (CI jobs:
  `jasmine`, `frontend-checks`)

## Notes
- **Related gap, out of scope:** `CharacterTreasures.jsx` and `CharacterRecipes.jsx` also read
  `character.can_exchange_treasure` / `can_exchange_recipe` from a `CharacterContextController`
  character, but `#mergeAccess` never merges those flags. Their Exchange buttons therefore appear
  never to render. Track this separately and do not fix it here, even though the fix would be
  the same one-line pattern in `#mergeAccess`.
- No i18n changes, because the button label already exists.
