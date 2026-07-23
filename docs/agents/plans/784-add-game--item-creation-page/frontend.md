# Frontend Plan: Add Game Item Creation Page

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /games/<slug>/items.json` creates a bare `GameItem` — request body
  `{name, description, hidden}`; success is `201` with `{id, name, photo_path, description,
  hidden}` (**`id`, not `game_item_id`** — different from the character-scoped endpoint). `400`
  gives `{errors: {...}}`.
- `GET /games/<slug>/permissions.json` gains a `can_create_item` boolean (via
  `AccessStore.ensureGamePermissions(gameSlug)`), to be used both for the new page's mount-time
  redirect and for gating the new "Create Item" link — **not** `ListPage`'s `onCanEditChange`.
- Photo upload stays `POST /games/<slug>/items/<id>/photo_upload.json`, unchanged.
- Translation namespace `character_item_new_page` is being renamed to `item_new_page` by the
  translator agent (see [translator.md](translator.md)) — this PR must update the JS references
  in the same change, or the app/`check_i18n` breaks.

## Implementation Steps

### Step 1 — New page: `GameItemNew`

Add `frontend/assets/js/components/resources/item/pages/GameItemNew.jsx`, mirroring
`../../character/pages/shared/CharacterItemNew.jsx` but without `characterKind`/`characterId`
(there is no owning character). Extract `game_slug` via
`BasePageController.extractParam('/games/:game_slug/items/new', 'game_slug', currentHash)`.
Render through the existing generic form: either reuse
`../../character/pages/helpers/CharacterItemNewHelper.jsx` directly (it already just calls
`ShowPageLayout type="item" mode="new"` with no character-specific content) or add a thin
`frontend/assets/js/components/resources/item/pages/helpers/GameItemNewHelper.jsx` that does the
same — pick whichever reads more clearly; either is a one-line-bodied class. Keep the
`PhotoUploadModal` (`deferred`) wiring identical to `CharacterItemNew.jsx`.

### Step 2 — New controller: `GameItemNewController`

Add `frontend/assets/js/components/resources/item/pages/controllers/GameItemNewController.js`,
mirroring `CharacterItemNewController.js`:

- `buildEffect()`: call `AccessStore.ensureGamePermissions(gameSlug)` and redirect to
  `/games/${gameSlug}/items` when `!permissions.can_create_item` (mirrors
  `GameNpcNewController#buildEffect`'s `can_edit` redirect, keyed on `can_create_item` instead —
  reuse that same catch-and-redirect-on-failure shape).
- `submitForm()`: call a new `GameClient#createItem(gameSlug, token, fields)` (Step 3). On `201`,
  read `data.id` (not `data.game_item_id`) as the created item's id.
- `#uploadPhoto()`: `POST /games/${gameSlug}/items/${itemId}/photo_upload.json`, identical to
  `CharacterItemNewController`'s.
- Redirect target after success (with or without photo) is always `/games/${gameSlug}/items`.

### Step 3 — `GameClient#createItem`

In `frontend/assets/js/client/GameClient.js`, add:

```js
createItem(gameSlug, token, fields) {
  return this.postJson(`/games/${gameSlug}/items.json`, token, fields);
}
```

### Step 4 — Register the route

In `frontend/assets/js/utils/routing/HashRouteResolver.js`, insert
`['/games/:game_slug/items/new', 'gameItemNew']` **immediately before**
`['/games/:game_slug/items/:id/edit', 'gameItemEdit']` (current line ~45), so the literal `new`
segment isn't swallowed by the less-specific `:id` route — same ordering concern already applied
to `npcs/new` vs `npcs/:character_id`.

### Step 5 — Wire the page into `AppHelper`

In `frontend/assets/js/components/helpers/AppHelper.jsx`, import `GameItemNew` and add
`gameItemNew: <GameItemNew />` to the `PAGES` map, next to the existing `gameItems` entry.

### Step 6 — Gate + add the "Create Item" link on the list page

- `frontend/assets/js/components/resources/item/pages/GameItems.jsx`: add its own effect fetching
  `AccessStore.ensureGamePermissions(gameSlug)` and store `canCreateItem` in local state — do
  **not** reuse `ListPage`'s built-in `onCanEditChange`/`canEdit` (that reflects plain `can_edit`,
  dm/admin only, and would wrongly hide the link from staff). Pass `canCreateItem` and
  `newHref={`#/games/${gameSlug}/items/new`}` down to `GameItemsHelper.render`.
- `frontend/assets/js/components/resources/item/pages/helpers/GameItemsHelper.jsx`: add a
  `NewButton` (same component `GameTreasuresHelper` uses) inside `PageActions`, gated on
  `state.canCreateItem`, mirroring `GameTreasuresHelper`'s `#renderNewButton`. Update this class's
  doc comment ("Read-only (issue #658): no 'New'/'Add' action...") since it's no longer accurate.

### Step 7 — Update i18n key references (coordinate with translator)

In the 6 shared `Item*` element files under
`frontend/assets/js/components/resources/item/pages/elements/show/` (`ItemTitle.jsx`,
`ItemNameField.jsx`, `ItemDescriptionField.jsx`, `ItemHiddenField.jsx`, `ItemSubmitButton.jsx`,
`ItemNewPhotoUploadFailedAlert.jsx`), rename every `character_item_new_page.*` key reference to
`item_new_page.*`, and the `character-item-new-*` DOM ids to `item-new-*`. Also update
`frontend/assets/js/components/common/show_page/show_types/configs/itemShowType.js`'s doc comment
— it currently says "There is no `game-item` creation flow today"; that's no longer true. In
`GameItemsHelper.jsx`, use the new `game_items_page.create_item` key (added by translator) for
the new button's label.

### Step 8 — Specs

Add/extend Jasmine specs alongside every file touched above: `GameItemNew.jsx`,
`GameItemNewController.js`, `GameClient.js` (`createItem`), `GameItems.jsx` (permission-gated
effect), `GameItemsHelper.jsx` (new-button gating), `HashRouteResolver.js` (new route + ordering
against `:id`/`:id/edit`), `AppHelper.jsx` (`PAGES` entry), and update the existing specs for the
6 renamed-namespace element files plus `itemShowType.js` if it has a comment-only spec assertion.

## Files to Change

- `frontend/assets/js/components/resources/item/pages/GameItemNew.jsx` (new)
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemNewController.js` (new)
- `frontend/assets/js/components/resources/item/pages/helpers/GameItemNewHelper.jsx` (new, thin —
  or reuse `CharacterItemNewHelper.jsx` directly)
- `frontend/assets/js/client/GameClient.js`
- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/components/resources/item/pages/GameItems.jsx`
- `frontend/assets/js/components/resources/item/pages/helpers/GameItemsHelper.jsx`
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemTitle.jsx`
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemNameField.jsx`
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemDescriptionField.jsx`
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemHiddenField.jsx`
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemSubmitButton.jsx`
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemNewPhotoUploadFailedAlert.jsx`
- `frontend/assets/js/components/common/show_page/show_types/configs/itemShowType.js` (comment only)
- corresponding spec files for everything above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — passes once translator's rename
  and this PR's key-reference updates land together

## Notes

- `CharacterItemNew.jsx`/`CharacterItemNewController.js` (PC/NPC flow) are not modified — only the
  already-generic `Item*` elements' i18n key constants change.
- Confirm final choice (dedicated `GameItemNewHelper.jsx` vs. reusing `CharacterItemNewHelper.jsx`
  as-is) doesn't leave a `Character`-named class rendering a page with no character in scope if
  reused directly; a one-line new file avoids that awkwardness cheaply.
