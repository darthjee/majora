# Plan: Add edit item button

Issue: [782-add-edit-item-button.md](../../issues/782-add-edit-item-button.md)

## Overview
Add an Edit button to the three item show pages (game item, PC item, NPC item), following the exact `EditButton`/`ConditionalComponent`/`pageActions` pattern already used on the game and character show pages. Since items have no `can_edit` field on their payload (unlike games/characters), the two item detail controllers need to derive it from the same `AccessStore.ensureGamePermissions`/`ensureCharacterPermissions` calls that already back the show page's own `full.json`-vs-regular endpoint choice, and expose it to the page component as a new piece of state.

## Context
The three routes (`/#/games/:game_slug/items/:id`, `.../pcs/:character_id/items/:id`, `.../npcs/:character_id/items/:id`) all render through the shared `ItemDetailHelper.render()`, which currently calls `ShowPageLayout` without a `pageActions` prop at all. The corresponding `/edit` routes and pages already exist and work — only the entry point link is missing.

`GameHelper.jsx` and `CharacterHelper.jsx` show the exact target shape:

```jsx
pageActions={(
  <ConditionalComponent render={game.can_edit}>
    <EditButton href={`#/games/${game.game_slug}/edit`}>
      {Translator.t('character_page.edit')}
    </EditButton>
  </ConditionalComponent>
)}
```

Both reuse the existing `character_page.edit` translation key (value: "Edit") rather than a resource-specific one — no new translation key is needed here.

The permission source already exists: `AccessStore.ensureGamePermissions(gameSlug)` and `AccessStore.ensureCharacterPermissions(kind, gameSlug, characterId)` both resolve `{ can_edit: boolean }` (see `frontend/assets/js/utils/access/store/AccessStore.js:73-99`), and are the same calls `RequestPermissionResolvers` already makes internally to pick between an item's `full.json` and player-facing endpoint. `AccessStore`'s own caching means calling them again from the controller costs no extra network round trip (already relied on by the existing `canUploadPhoto`/`can_upload_item_photo` derivations in these same controllers).

## Implementation Steps

### Step 1 — Expose `canEdit` from `GameItemController`
In `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js`:
- Add a `setCanEdit` constructor param (new 5th arg, before `client`, mirroring the existing `setCanUploadPhoto` param).
- Add a private `#loadCanEdit(gameSlug, safeSet)` method calling `AccessStore.ensureGamePermissions(gameSlug)`, reading `.can_edit` (`Boolean(permissions.can_edit)`), catching to `false`, and calling `safeSet(this.setCanEdit, ...)` — mirroring `#loadCanUploadPhoto`'s shape exactly.
- Call `this.#loadCanEdit(params.game_slug, safeSet)` alongside `this.#loadCanUploadPhoto` in `#loadItem`.

### Step 2 — Expose `canEdit` from `CharacterItemDetailController`
In `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js`:
- Add a `setCanEdit` constructor param (new 5th arg, before `client`, same position convention as Step 1).
- Add a private `#loadCanEdit(params, safeSet)` method calling `AccessStore.ensureCharacterPermissions(this.characterKind, params.game_slug, params.character_id)`, reading `.can_edit`, catching to `false`, and calling `safeSet(this.setCanEdit, ...)` — mirroring `#loadCanUploadPhoto`.
- Call `this.#loadCanEdit(params, safeSet)` alongside `this.#loadCanUploadPhoto` in `#loadItem`.

### Step 3 — Add the Edit button to `ItemDetailHelper`
In `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx`:
- Import `EditButton` (`../../../../common/buttons/EditButton.jsx`), `ConditionalComponent` (`../../../../common/misc/ConditionalComponent.jsx`), matching `GameHelper.jsx`'s imports.
- Change `static render(item, backHref, canUploadPhoto = false, onUploadClick = Noop.noop)` to accept two more params: `canEdit = false` and `editHref` (required — every caller will now always pass one), e.g. `static render(item, backHref, editHref, canEdit = false, canUploadPhoto = false, onUploadClick = Noop.noop)`.
- Pass a `pageActions` prop to `ShowPageLayout`:
  ```jsx
  pageActions={(
    <ConditionalComponent render={canEdit}>
      <EditButton href={editHref}>
        {Translator.t('character_page.edit')}
      </EditButton>
    </ConditionalComponent>
  )}
  ```
- Update the JSDoc for the new params.

### Step 4 — Wire `GameItem.jsx`
In `frontend/assets/js/components/resources/item/pages/GameItem.jsx`:
- Add `const [canEdit, setCanEdit] = useState(false);` and pass `setCanEdit` into the controller constructor (after `setError`, before `setCanUploadPhoto`, matching the new controller signature from Step 1).
- Build `const editHref = \`#/games/${gameSlug}/items/${item?.id}/edit\`;` (item is guaranteed non-null past the loading/error guards, so this can be computed right before the `return`, alongside `backHref`).
- Update the `ItemDetailHelper.render(...)` call site to the new argument order/count from Step 3.

### Step 5 — Wire `CharacterItem.jsx`
In `frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx`:
- Same pattern as Step 4: add `canEdit` state, pass `setCanEdit` into the controller constructor (matching Step 2's new signature), build `editHref = \`#/games/${gameSlug}/${characterKind}/${characterId}/items/${item.id}/edit\``, update the `ItemDetailHelper.render(...)` call site.

### Step 6 — Update/add specs
- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js` — add coverage for the new `setCanEdit` derivation (success and catch-to-`false` paths), mirroring existing `setCanUploadPhoto` spec cases.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterItemDetailControllerSpec.js` — same, for `CharacterItemDetailController`.
- `frontend/specs/assets/js/components/resources/item/pages/helpers/ItemDetailHelperSpec.js` — add cases asserting the Edit button renders/hides based on `canEdit`, and links to the passed `editHref`.
- `frontend/specs/assets/js/components/resources/item/pages/GameItemSpec.js` — assert the controller is constructed with `setCanEdit` and the rendered edit href.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterItemSpec.js` — same, for the PC/NPC-shared page.

## Files to Change
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` — derive and expose `canEdit` via `AccessStore.ensureGamePermissions`.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js` — derive and expose `canEdit` via `AccessStore.ensureCharacterPermissions`.
- `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx` — add `pageActions`/`EditButton`/`ConditionalComponent` rendering.
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` — pass `canEdit`/`editHref` through.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx` — pass `canEdit`/`editHref` through.
- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js` — new test cases.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterItemDetailControllerSpec.js` — new test cases.
- `frontend/specs/assets/js/components/resources/item/pages/helpers/ItemDetailHelperSpec.js` — new test cases.
- `frontend/specs/assets/js/components/resources/item/pages/GameItemSpec.js` — updated test cases.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterItemSpec.js` — updated test cases.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`) — full Jasmine suite + coverage, must stay green and keep the project's coverage threshold.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — ESLint.
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no new translation key is introduced (reusing `character_page.edit`), so this should pass unchanged, but re-run since keys are touched.

## Notes
- No backend, API, or permission changes are needed — `can_edit` is already computed server-side and already resolved client-side via `AccessStore`; this issue only exposes an already-resolved value to two more page components.
- `ItemDetailHelper.render`'s new `editHref` param is a plain required string built by each of the two callers (context-specific), rather than being derived inside the helper itself, keeping the helper free of route-shape knowledge (consistent with today's `backHref` handling, which is also caller-supplied).
- Double check argument order/positions against `GameItemController`'s and `CharacterItemDetailController`'s current constructors when implementing, since this plan proposes inserting `setCanEdit` before the existing `client` param — any test mocks that construct these controllers positionally will need matching updates.
