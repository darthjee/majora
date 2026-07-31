# Frontend Plan: Remove edit money endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend removes `PUT .../pcs/:id/money.json` and `PUT .../npcs/:id/money.json` — nothing may call these anymore.
- Backend's PATCH endpoints (`.../pcs/:id.json`, `.../npcs/:id.json`) now accept `money` for both PC and NPC (previously PC-only).
- `permissions.json` no longer returns `can_edit_money` — replace its usage with `can_edit`.
- The quick-edit money modal on the character detail page must keep its current UX, but submit through the existing PATCH plumbing instead of the removed PUT endpoint.

## Implementation Steps

### Step 1 — Repoint the quick-edit money submit from PUT to PATCH

`CharacterController.js:72-81`'s `updateCharacterMoney(gameSlug, characterId, token, money)` currently calls `RequestStore.mutate({ method: 'PUT', quantityType: 'single', params: {gameSlug, id: characterId}, body: {money} })`, which resolves via `pcConfig.js`/`npcConfig.js`'s `PUT.single` → the `money.json` route. Change it to `method: 'PATCH'` (resolving to the existing `patchRegular`/`PATCH.single.regular` entry, `.../pcs/:id.json` or `.../npcs/:id.json`) with the same `body: {money}`. Keep the function name/signature — only the underlying request method/route changes.

### Step 2 — Remove the PUT `money.json` route config

Remove the `money` entry and its `PUT.single` wiring from `frontend/assets/js/utils/requests/config/pcConfig.js` (route at line 45, `PUT.single` at line 72) and `frontend/assets/js/utils/requests/config/npcConfig.js` (route at line 47, `PUT.single` at line 81). Leave `patchRegular`/`PATCH.single` untouched — Step 1 now depends on it for both PC and NPC.

### Step 3 — Remove `CharacterClient.updateCharacterMoney`

`updateCharacterMoney` in `frontend/assets/js/client/CharacterClient.js:96-100` calls `putJson` directly against `.../money.json` and is a separate code path from `CharacterController.js`'s method of the same name — confirm nothing still calls this `CharacterClient` method after Step 1/2 land (it appears to be dead once the PUT route is gone), and remove it if so.

### Step 4 — Swap `can_edit_money` for `can_edit`

- `CharacterAccessResolver.js:28` — remove the `can_edit_money: Boolean(permissions.can_edit_money)` line (the field no longer exists in `permissions.json`).
- `CharacterHelper.jsx:36-38` — update the JSDoc for `canEditMoney`/`character.can_edit_money` to reference `character.can_edit` instead.
- `CharacterEdit.jsx:136` — change `canEditMoney: character.can_edit_money` to `canEditMoney: character.can_edit`.
- Search for any other reads of `can_edit_money` on the character object (e.g. `CharacterDetail.jsx`, wherever it gates the detail-page "Edit" money link) and repoint them to `can_edit`.

### Step 5 — Make `money` writable in the NPC player-facing PATCH form

`CharacterEditFieldsBuilder.js`'s `fullEditorFields` (line 50) already includes `money: parseInt(formValues.money, 10)`, but `playerFields` (lines 72-81, used for the NPC player-only PATCH path) does not. Since the backend now accepts `money` on NPC PATCH for any role that can reach this form (including the newly-broadened `staff`), add `money: parseInt(formValues.money, 10)` to `playerFields` as well, mirroring `fullEditorFields`.

### Step 6 — Update/remove specs

Update the following to match the PATCH-based flow and the `can_edit`-based gating (remove specs that only make sense for the deleted PUT endpoint, update assertions elsewhere):
- `frontend/specs/assets/js/client/CharacterClient/updateCharacterMoneySpec.js` — remove if `CharacterClient.updateCharacterMoney` is deleted in Step 3.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/updateCharacterMoneySpec.js` — update to assert a `PATCH` call to the regular endpoint instead of `PUT` to `money.json`.
- `frontend/specs/.../CharacterAccessResolverSpec.js` — remove `can_edit_money` assertions.
- `frontend/specs/.../CharacterController/fetchAndMergeAccessSpec.js`, `.../loadCharacterSpec.js` — update any fixtures/assertions referencing `can_edit_money`.
- `frontend/specs/.../CharacterDetailController/basicFetchSpec.js`, `canEditResolutionSpec.js`, `fullDetailFetchSpec.js`, `tokenHandlingSpec.js` — update `can_edit_money` fixtures/assertions to `can_edit` where relevant.
- `frontend/specs/.../BaseCharacterEditController/buildEffectSpec.js`, `.../CharacterEditController/buildEffectSpec.js` — verify still pass given the `playerFields`/`money` change in Step 5; update fixtures if they assert on the submitted field set.
- `frontend/specs/.../CharacterMoneySlotSpec.js`, `.../CharacterHelper/moneyEditSpec.js`, `.../CharacterDetailMoneySpec.js`, `.../CharacterEditMoneySpec.js`, `.../CharacterEditPcAccessGuardSpec.js` — update gating assertions from `can_edit_money` to `can_edit`, and submit-path assertions from PUT to PATCH where applicable.
- `frontend/specs/.../GameNpcNewSpec.js` — check for `can_edit_money`/money-field assumptions specific to NPC creation; update if present.
- `frontend/specs/assets/js/utils/requests/RequestMutationClientSpec.js`, `resourceConfigSpec.js` — update/remove any fixtures referencing the removed `money.json` PUT route.

Do **not** touch `MoneyEditModal`/`MoneyEditModalController`/`MoneyEditModalHelper` (component or specs) or the treasure-related specs (`GameTreasureNewSpec.js`, `TreasureNewSpec.js`) — the shared money-breakdown widget and its specs are also used by treasure editing, which is unrelated to this change and makes no network calls of its own (the caller decides PUT vs PATCH).

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`) — run via `make dev` / `make tests` per project convention (never invoke `yarn`/`npm` directly on the host).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).

## Notes
- Confirm at implementation time whether `CharacterClient.updateCharacterMoney` (Step 3) truly has no remaining callers before deleting it — the two `updateCharacterMoney` functions (in `CharacterClient.js` and `CharacterController.js`) are easy to conflate; only the `CharacterController.js` one is on the active detail-page money-edit path per the exploration done during planning.
- Double check `CharacterDetail.jsx` (money-edit modal open/confirm handler) for any other direct reference to `can_edit_money` beyond what's listed in Step 4.
