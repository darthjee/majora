# Frontend Plan: Add missing routes to the Navi cache warmer

Main plan: [plan.md](plan.md)

## Shared contracts

- Preview page size is `5` (`MAX_PREVIEW_ITEMS`, `frontend/assets/js/components/common/cards/characterPreviewConstants.js:9`).
- After this fix, the preview must request exactly:
  - `/games/{:slug}/pcs/{:id}/treasures.json?per_page=5`
  - `/games/{:slug}/npcs/{:id}/treasures.json?per_page=5`
  - `/games/{:slug}/pcs/{:id}/items.json?per_page=5`
  - `/games/{:slug}/npcs/{:id}/items.json?per_page=5`
  (infra's cache warmer entries will target these exact URLs.)

## Implementation Steps

### Step 1 — Make `#fetchCharacter` support an optional `per_page` query param

`frontend/assets/js/client/CharacterClient.js:355-363` builds the request path
(`${base}/${suffix}.json`) and appends `this.buildRoleQuery(roles)`. Extend it (or add a
parallel private helper) so a `per_page` value can be appended to the query string alongside
the role query, without breaking the existing `.json` suffix placement or the `X-Skip-Cache`
header logic on line 358.

### Step 2 — Default `fetchCharacterTreasures`/`fetchCharacterItems` to `per_page=5`

`fetchCharacterTreasures` (`CharacterClient.js:79-81`) and `fetchCharacterItems`
(`CharacterClient.js:93-95`) are the shared methods that populate the PC/NPC detail-page
preview (via `CharacterHelper.jsx:103-129`'s `PreviewSection`s). Make these methods responsible
for requesting a bounded page themselves — e.g. a default parameter of `5` — rather than
requiring each call site to remember to pass it, mirroring how `GameController.js:125,142,144`
already requests `?per_page=${MAX_PREVIEW_ITEMS}` explicitly for the game-page PC/NPC preview.

Do not import `MAX_PREVIEW_ITEMS` from `frontend/assets/js/components/common/cards/characterPreviewConstants.js`
into `CharacterClient.js` — nothing under `frontend/assets/js/client/` currently imports from
`components/`, so keep the default as a local constant (value `5`) in `CharacterClient.js`
instead of introducing a new cross-layer dependency.

### Step 3 — Verify callers still behave correctly

`CharacterController`/`CharacterListsController#fetchAndMergeTreasures` (and the items
equivalent) call `fetchCharacterTreasures`/`fetchCharacterItems` to populate the preview data —
confirm they don't already pass a page-size argument that would conflict with the new default,
and that the client-side `Array.slice(0, maxItems)` truncation in
`frontend/assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx:23` remains
harmless now that the backend already returns at most 5 items.

Separately, confirm the full paginated treasures/items list pages
(`PcCharacterTreasures.jsx`/`NpcCharacterTreasures.jsx`/`PcCharacterItems.jsx`/`NpcCharacterItems.jsx`,
via `buildFetchCharacterTreasures`/`buildFetchCharacterItems` in
`frontend/assets/js/components/common/list_types/configs/characterTreasureListTypes.js` and the
items equivalent) go through `fetchPermissionGatedIndex`/`GenericClient`, not
`CharacterClient#fetchCharacterTreasures`/`fetchCharacterItems` — so this change must not affect
their real `page`/`per_page` pagination behavior.

## Files to Change
- `frontend/assets/js/client/CharacterClient.js` — add `per_page` support to `#fetchCharacter`
  and default `fetchCharacterTreasures`/`fetchCharacterItems` to `per_page=5`.
- `frontend/specs/**` (wherever `CharacterClient` is unit-tested) — add/update specs asserting
  the preview fetch now includes `?per_page=5`, and that the full paginated list flow is
  unaffected.

## CI Checks
- `frontend`: `npm run test` or `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No new UI copy is introduced, so no translation keys are needed.
- Keep the `X-Skip-Cache` header logic (`CharacterClient.js:358`) untouched — it's unrelated to
  pagination and must keep applying to NPC treasures/items/detail requests.
