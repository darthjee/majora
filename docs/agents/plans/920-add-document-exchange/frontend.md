# Frontend plan: Add document exchange

See [plan.md](plan.md) for the overview and the full shared-contracts section (routes, request/
response bodies, permission matrix, i18n keys). This file only covers frontend-specific steps.
Everything here clones the **Item** exchange modal (not Treasure's — no quantity/money), verified
file-by-file against the actual item implementation rather than assumed.

## 1. `documentConfig.js` (modify)

`frontend/assets/js/utils/requests/config/documentConfig.js` already has `GET.collection`/
`GET.single` and several `POST` upload-init entries — leave those untouched. Add:

```js
const availablePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/available.json`;
const availableAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/available/all.json`;
const acquirePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/acquire.json`;
const acquireAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/acquire/all.json`;
const removePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/remove.json`;
const removeAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/remove/all.json`;
```

...added to the exported object:

```js
GET: {
  collection: { /* unchanged */ },
  single: { /* unchanged */ },
  availableCollection: {
    regular: { path: availablePath, permission: null },
    private: { path: availableAllPath, permission: 'can_edit' },
  },
},
POST: {
  /* existing gameCollection/single/file/filePhoto unchanged */
  acquire: {
    regular: { path: acquirePath, permission: null },
    private: { path: acquireAllPath, permission: 'can_edit' },
  },
  remove: {
    regular: { path: removePath, permission: null },
    private: { path: removeAllPath, permission: 'can_edit' },
  },
},
```

## 2. `RequestPermissionResolvers.js` (modify)

Add one entry to the existing `document: { ... }` block in
`frontend/assets/js/utils/requests/RequestPermissionResolvers.js`, mirroring `item`'s own
`availableCollection` resolver exactly (always game-level, regardless of `kind` — a PC's owning
player must not get hidden-catalog visibility just from owning the character):

```js
availableCollection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
```

Do **not** add resolvers for `acquire`/`remove` — like items, callers always pass `variantName`
explicitly (see step 4/5), so `RequestStore.mutate`'s default permission-resolution path is never
used for these two.

## 3. `documentExchangeTabs.js` (new)

`frontend/assets/js/components/resources/character/pages/elements/documentExchangeTabs.js`,
copy of `itemExchangeTabs.js` verbatim except the imports/i18n keys:

```js
import AcquireDocumentTab from './tabs/AcquireDocumentTab.jsx';
import RemoveDocumentTab from './tabs/RemoveDocumentTab.jsx';

export default {
  acquire: {
    labelKey: 'document_exchange_modal.acquire_tab',
    tooltipKey: 'document_exchange_modal.acquire_tab_tooltip',
    Component: AcquireDocumentTab,
  },
  remove: {
    labelKey: 'document_exchange_modal.remove_tab',
    tooltipKey: 'document_exchange_modal.remove_tab_tooltip',
    Component: RemoveDocumentTab,
  },
};
```

## 4. Acquire tab (new: tab, controller, helper)

- `elements/tabs/controllers/AcquireDocumentTabController.js` — clone of
  `AcquireItemTabController.js`. `fetchPage` goes through `RequestStore.ensure({resource:
  'document', quantityType: 'availableCollection', params: {gameSlug, kind, id: characterId},
  query: {page, per_page, name: search}})`. `acquire(...)` goes through `RequestStore.mutate
  ({resource: 'document', method: 'POST', quantityType: 'acquire', params, body: {
  game_document_id: gameDocumentId, hidden }, variantName: gameCanEdit ? 'private' :
  'regular'})`. Error-key map: `{'already owned': 'document_exchange_modal.already_owned_error'}`,
  generic fallback `'document_exchange_modal.generic_error'`, load-error
  `'document_exchange_modal.load_error'`.
- `elements/tabs/helpers/AcquireDocumentTabHelper.jsx` — clone of `AcquireItemTabHelper.jsx`. Only
  real change: swap `CardItemImage` for **`CardDocumentImage`** (already exists at
  `frontend/assets/js/components/common/cards/CardDocumentImage.jsx` — do not create a new card
  component). Detail pane keeps the same two-column layout: browse list left, photo + `<h5>` name
  + hidden-toggle switch + Confirm/Cancel right. All i18n keys swap `item_exchange_modal.*` →
  `document_exchange_modal.*`.
- `elements/tabs/AcquireDocumentTab.jsx` — clone of `AcquireItemTab.jsx`, same state shape
  (`browse`, `selected`, `hidden`, `submitting`, `actionError`, `search`), same debounced
  (`SEARCH_DEBOUNCE_MS = 300`) search-input wiring to the `?name=` query param via `fetchPage`.
  `character` prop needs `id`, `game_slug`, `is_pc`, `gameCanEdit` (routes submit through the
  private endpoint — see plan.md's permission matrix: Acquire's private path is DM/admin-only,
  no PC-owner shortcut).

## 5. Remove tab (new: tab, controller, helper)

- `elements/tabs/controllers/RemoveDocumentTabController.js` — clone of
  `RemoveItemTabController.js`, with one important reuse: `fetchPage` goes through
  `RequestStore.ensure({resource: 'document', quantityType: 'collection', ...})` — the
  **existing, unmodified** `documents.json`/`documents/all.json` pair (`document.collection` is
  already configured and already resolved at the character level by
  `RequestPermissionResolvers.js` — no new config or resolver needed for the Remove tab's browse
  list, only for Acquire's). `remove(...)` goes through `RequestStore.mutate({resource:
  'document', method: 'POST', quantityType: 'remove', body: {game_document_id: gameDocumentId},
  variantName: canEdit ? 'private' : 'regular'})`. `confirmRemove` reads `selected.
  game_document_id` (already present on `CharacterDocumentSerializer`'s output — confirmed field
  exists today).
- `elements/tabs/helpers/RemoveDocumentTabHelper.jsx` — clone of `RemoveItemTabHelper.jsx`
  (browse list + selected-row confirm, no hidden toggle on Remove).
- `elements/tabs/RemoveDocumentTab.jsx` — clone of `RemoveItemTab.jsx`. `character` prop needs
  `id`, `game_slug`, `is_pc`, `canEdit` (character-level — Remove's private path additionally
  allows the PC's owning player, per plan.md's permission matrix).

## 6. Wire the modal into the documents page

- `pages/shared/CharacterDocuments.jsx` (modify) — add `showExchangeModal` state and a
  `handleExchangeSuccess` callback (refresh + re-fetch character context), same shape as
  `CharacterItems.jsx`. Add a `buildDocumentExchangeCharacter(characterId, gameSlug, isPc,
  character)` export returning `{id, game_slug, is_pc, canEdit: character?.can_edit, gameCanEdit:
  character?.game_can_edit}` (mirrors `buildItemExchangeCharacter`). Render `<ResourceExchangeModal
  show={showExchangeModal} character={buildDocumentExchangeCharacter(...)}
  tabs={documentExchangeTabs} defaultTab="acquire" onClose={...} onSuccess=
  {handleExchangeSuccess} />`. Documents have no create page/permission (per the existing
  docstring), so **do not** add a `canCreateDocument` access controller — only the exchange
  trigger, no separate create-permission resolution.
- `pages/helpers/CharacterDocumentsHelper.jsx` (modify) — add an optional trailing callback param
  (`onExchangeClick` or similar) that renders an "Exchange"/"Add" trigger button, mirroring
  `CharacterItemsHelper.render`'s own trailing-callback param exactly.

## 7. Tests

Add Jasmine specs mirroring the existing item exchange specs (`frontend/specs/.../
AcquireItemTab.spec.js`, `RemoveItemTab.spec.js`, `AcquireItemTabController.spec.js`, etc. — find
via `find frontend/specs -iname "*ItemExchange*" -o -iname "*AcquireItemTab*" -o -iname
"*RemoveItemTab*"`) into document-flavored equivalents. Cover: debounced search, selection/
detail-pane rendering, hidden-toggle default, submit success/error paths (already-owned →
`document_exchange_modal.already_owned_error`), and the `CharacterDocuments.jsx` exchange-button
wiring/`showExchangeModal` toggle.

Run via `docker-compose run --rm majora_fe yarn test` (coverage: `yarn coverage`) and
`docker-compose run --rm majora_fe yarn lint`.
