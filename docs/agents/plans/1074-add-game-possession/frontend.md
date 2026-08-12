# Frontend Plan: Add Game Possession

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the endpoints/payload shapes and i18n key names from [plan.md](plan.md)'s "Shared
contracts" section — backend/translator produce them, frontend wires them up as-is (do not
invent different key names or payload fields).

## Implementation Steps

### Step 1 — Request config

New `frontend/assets/js/utils/requests/config/possessionConfig.js`, a **much simpler** analog of
`itemConfig.js` — no `kind` branching (game-only, no PC/NPC), no `acquire`/`remove`/`summary`/
`availableCollection`:

```js
export default {
  GET: {
    collection: {
      regular: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions.json`, permission: null },
      private: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions/all.json`, permission: 'can_edit' },
    },
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`, permission: null },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/full.json`, permission: 'can_edit' },
    },
  },
  PATCH: {
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`, permission: 'can_edit' },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`, permission: 'can_edit' },
    },
  },
  POST: {
    collection: {
      regular: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions.json`, permission: 'can_edit' },
      private: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions.json`, permission: 'can_edit' },
    },
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/photo_upload.json`, permission: null },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/photo_upload.json`, permission: null },
    },
  },
};
```

Register it in `frontend/assets/js/utils/requests/resourceConfig.js` (import + add
`possession: possessionConfig` to `RESOURCES`). Confirm the `create`/`photo_upload` permission
values above against how `itemConfig.js`'s equivalent `'game'`-kind entries are actually gated
(`GameItemCreatePermission`/`GameItemPhotoUploadPermission`, a superset of plain `can_edit` that
also includes staff/player per `game_item/endpoints.yml`) — if `RequestStore`'s permission
lookup can't express that superset directly the way it does for `item`, add a
`possession`-specific entry to `RequestPermissionResolvers.js` mirroring `item`'s, rather than
silently under- or over-gating the create/upload actions.

### Step 2 — List-page card wiring

- New `frontend/assets/js/components/common/list_types/GamePossessionListItem.js` — mirrors
  `GameItemListItem.js` exactly (extends `BaseListItem`, adds a `hidden` getter).
- New `frontend/assets/js/components/common/cards/CardPossessionImage.jsx` — mirrors
  `CardItemImage.jsx`, importing a new `default_possession.png` placeholder (see
  [plan.md](plan.md)'s note — flag if no art is supplied rather than fabricating an image).
- Register `possession: CardPossessionImage` in `ActionsOverlay.jsx`'s `PHOTO_COMPONENTS`, and
  extend its `type` prop JSDoc union.
- In `frontend/assets/js/components/common/list_types/listTypeConfig.js`: add a
  `fetchGamePossessions(gameSlug, hashResolver)` function mirroring `fetchGameItems` exactly
  (`resource: 'possession'`, `kind` omitted since there's no branching), a
  `buildGamePossessionHref(item, context)` mirroring `buildGameItemHref`
  (`#/games/${context.gameSlug}/possessions/${item.data.id}`), and a `possessions` entry in
  `listTypeConfig`:
  ```js
  possessions: {
    fetchList: fetchGamePossessions,
    wrapperClass: GamePossessionListItem,
    filtersComponent: null,
    photoType: 'possession',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('game_possessions_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildGamePossessionHref,
    itemsPerRow: 6,
  },
  ```
  Reuse `ItemCardHelper`/`buildItemInfoBarItems` as-is (already generic over any `{hidden}`
  entity) — do not duplicate a `PossessionCardHelper`.

### Step 3 — Routes

Add to `frontend/assets/js/utils/routing/HashRouteResolver.js`, alongside the `items` block:

```js
['/games/:game_slug/possessions/new', 'gamePossessionNew'],
['/games/:game_slug/possessions/:id/edit', 'gamePossessionEdit'],
['/games/:game_slug/possessions/:id', 'gamePossession'],
['/games/:game_slug/possessions', 'gamePossessions'],
```

### Step 4 — Pages

New folder `frontend/assets/js/components/resources/possession/`, mirroring
`resources/item/`'s structure minus everything PC/NPC/give-modal-related:

- `pages/GamePossessions.jsx` + `controllers/GamePossessionsController.js` +
  `helpers/GamePossessionsHelper.jsx` — mirrors `GameItems.jsx`/`GameItemsController.js`/
  `GameItemsHelper.jsx` (renders `<ListPage type="possessions" .../>`, gates the "Create
  Possession" button on `can_create_possession`)
- `pages/GamePossessionNew.jsx` + `controllers/GamePossessionNewController.js` +
  `helpers/GamePossessionNewHelper.jsx` — mirrors the `GameItemNew*` trio (name/description/
  hidden form, then photo upload with retry/skip on failure)
- `pages/GamePossessionEdit.jsx` + `controllers/GamePossessionEditController.js` +
  `helpers/PossessionEditHelper.jsx` — mirrors `GameItemEdit*` (note: item's own edit-helper is
  named `ItemEditHelper.jsx`, not `GameItemEditHelper.jsx` — match that same unprefixed
  convention)
- `pages/GamePossession.jsx` + `controllers/GamePossessionController.js` +
  `helpers/PossessionDetailHelper.jsx` — mirrors `GameItem.jsx`/`GameItemController.js`/
  `ItemDetailHelper.jsx` (show page with inline photo-replace upload)
- `pages/elements/show/{PossessionDescriptionField,PossessionHiddenField,PossessionNameField,
  PossessionNameHeading,PossessionNewPhotoUploadFailedAlert,PossessionPhoto,
  PossessionSubmitButton,PossessionTitle}.jsx` — mirror the equivalent `Item*.jsx` files
  1:1 (drop the `Item` prefix's `Give`/receiving-row files — no acquisition here)

Register the four page components in `frontend/assets/js/components/helpers/AppHelper.jsx`
(import + `gamePossession`/`gamePossessionEdit`/`gamePossessionNew`/`gamePossessions` entries),
mirroring the `gameItem*` block exactly.

### Step 5 — Nav entry

In `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`'s
`renderGameNavLinks`, add a `possessions` link next to the existing `items`/`documents` ones:

```jsx
<NavDropdown.Item href={`#/games/${gameSlug}/possessions`}>{Translator.t('game_page.possessions')}</NavDropdown.Item>
```

## Files to Change

- `frontend/assets/js/utils/requests/config/possessionConfig.js` — new
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `possession`
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — only if the `can_edit`
  superset gap from Step 1 requires it
- `frontend/assets/js/components/common/list_types/GamePossessionListItem.js` — new
- `frontend/assets/js/components/common/cards/CardPossessionImage.jsx` — new
- `frontend/assets/images/placeholders/default_possession.png` — new (or flagged as blocked)
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — register `possession` photo type
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — add `possessions` entry
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add 4 routes
- `frontend/assets/js/components/resources/possession/**` — new (pages/controllers/helpers/elements, ~20 files, see Step 4)
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the 4 page components
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — add nav link

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — new specs mirroring the `item/` spec
  suite under `frontend/specs/`
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until translator's
  files land; coordinate ordering or land together

## Notes

- Confirm during implementation whether `possessionConfig.js`'s `POST.collection`/`POST.single`
  permission needs a custom resolver (see Step 1) — don't assume plain `can_edit` is sufficient
  without checking `game_possession/endpoints.yml`'s actual `staff`+`player` grant.
- No PC/NPC pages, no give/acquire modal, no `character_possession*` anything.
