# Frontend Plan: Add documents show page and create page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend endpoints and `can_create_document` permissions field exactly as described in [plan.md](plan.md)'s "Shared contracts" section. Posts exactly `{ name, description, hidden }` on create — no `photo`. Uses translator-owned i18n keys listed below (do not hardcode strings — add the keys via the `translator` agent's file, referencing them by key here).

## Implementation Steps

### Step 1 — `GameClient.createDocument`

In `frontend/assets/js/client/GameClient.js`, add `createDocument(gameSlug, token, fields)`, mirroring `createItem` exactly:

```js
createDocument(gameSlug, token, fields) {
  return this.postJson(`/games/${gameSlug}/documents.json`, token, fields);
}
```

### Step 2 — Route registration

In `frontend/assets/js/utils/routing/HashRouteResolver.js`'s `ROUTES` array, add two entries right before the existing `['/games/:game_slug/documents', 'gameDocuments']` line (matching how the `items` block orders `new`/`:id` before the bare collection):

```js
['/games/:game_slug/documents/new', 'gameDocumentNew'],
['/games/:game_slug/documents/:id', 'gameDocument'],
```

Wire both page keys in `frontend/assets/js/components/helpers/AppHelper.jsx` (import `GameDocumentNew`/`GameDocument`, add `gameDocumentNew: <GameDocumentNew />` and `gameDocument: <GameDocument />` to the page map), mirroring the existing `gameItemNew`/`gameItem` entries.

### Step 3 — Request-layer wiring for the show page

In `frontend/assets/js/utils/requests/config/documentConfig.js`, add a `single` family for `kind: 'game'` (only — character-document detail endpoints don't exist yet, unlike `itemConfig.js`'s dual-family branching):

```js
single: {
  regular: {
    path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}.json`,
    permission: null,
  },
  private: {
    path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/full.json`,
    permission: 'can_edit',
  },
},
```

In `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`, add a `single` resolver under the existing `document` entry (the `collection` resolver already there assumes a character `kind` — leave it as-is, only add `single`):

```js
document: {
  collection: ({ gameSlug, kind, id }) => AccessStore.ensureCharacterPermissions(kind, gameSlug, id),
  single: ({ gameSlug, id }) => AccessStore.ensureGamePermissions(gameSlug),
},
```

### Step 4 — Show page

New files under `frontend/assets/js/components/resources/document/pages/`:

- `GameDocument.jsx` — mirrors `GameItem.jsx`, but simpler: no `canEdit`/`canUploadPhoto`/`PhotoUploadModal`/edit button (out of scope for this issue) — just `loading`/`error`/render via a new `DocumentDetailHelper`. Fetches via `RequestStore.ensure({ resource: 'document', quantityType: 'single', params: { gameSlug, kind: 'game', id } })`.
- `controllers/GameDocumentController.js` — mirrors `GameItemController.js` minus the `canEdit`/`canUploadPhoto` derivation entirely (this page has neither an edit button nor an upload button).
- `helpers/DocumentDetailHelper.jsx` — renders `name`, `description`, `photo_path` (if set) via `ShowPageLayout` (`type="document"`, `mode="show"`), following `ItemDetailHelper`'s structure minus the edit/upload affordances.
- `elements/show/DocumentPhoto.jsx`, `DocumentNameHeading.jsx` (or reuse a shared/generic element if one already covers a plain photo+name — check `ShowPageLayout`'s existing `item`/`treasure` element folders for a pattern to reuse before writing new ones).

New `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`, mirroring `itemShowType.js` but without any `hidden`/photo-picker fields in the `New` variant per Step 5, and without `Edit` entries at all (no edit mode in this issue):

```js
const documentShowType = {
  left: [DocumentPhoto, { Show: DocumentNameHeading }],
  right: [
    { New: DocumentTitle },
    { New: DocumentNameField },
    { Show: DescriptionBox, New: DocumentDescriptionField },
    { New: DocumentHiddenField },
    { New: DocumentSubmitButton },
  ],
  bottom: [],
};
```

### Step 5 — Create page

New files under `frontend/assets/js/components/resources/document/pages/`:

- `GameDocumentNew.jsx` — mirrors `GameItemNew.jsx` but **without any photo upload wiring at all** (no `PhotoUploadModal`, no `photoFile`/`gameItemId` state, no retry/skip handlers) — just `name`/`description`/`hidden` form state via `useFormState`, submit, and redirect. On mount, redirect to the documents list if `can_create_document` is false (mirroring `GameItemNewController`'s `#redirectIfNotAllowed`).
- `controllers/GameDocumentNewController.js` — mirrors `GameItemNewController.js` but drop `PhotoUploadSaga`, `#uploadPhoto`, `retryPhotoUpload` entirely; `submitForm` posts via `gameClient.createDocument` and redirects straight to the documents list on `201` (no photo-upload branch).
- `helpers/GameDocumentNewHelper.jsx` — thin `ShowPageLayout` wrapper (`type="document"`, `mode="new"`), mirroring `GameItemNewHelper.jsx`.

### Step 6 — "Create documents" button + card links on the list page

Edit `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentsHelper.jsx` to add a `#renderNewButton(state)` gated on `state.canCreateDocument`, mirroring `GameItemsHelper.#renderNewButton` exactly (same `NewButton`/`PageActions` usage, translated label from the new i18n key below).

Edit `frontend/assets/js/components/resources/document/pages/GameDocuments.jsx` (or add a new `controllers/GameDocumentsController.js` if one doesn't already back this page) to resolve `can_create_document` via `AccessStore.ensureGamePermissions`, mirroring `GameItemsController.js` exactly (same "independent of `ListPage`'s `canEdit`" reasoning — `can_create_document` must not be conflated with the plain `can_edit`/DM-only gate).

Edit `frontend/assets/js/components/common/list_types/configs/documentListTypes.js`'s `buildDocumentHref` — currently always returns `null` (see its docstring referencing issue #725). Change it to return a link for the **game-scoped** `documents` list type only (leave `pc-documents`/`npc-documents` returning `null`, since character-document detail pages remain out of scope):

```js
function buildDocumentHref(item, context) {
  return `#/games/${context.gameSlug}/documents/${item.data.id}`;
}
```

Check how `buildGameItemHref` in `listTypeConfig.js` distinguishes list types sharing one builder function (if `pc-documents`/`npc-documents` need a separate no-op builder, split it the same way items would if they had a character-scoped equivalent) — read `buildItemHref` usage in `listTypeConfig.js` for the exact pattern before writing this.

### Step 7 — Tests

Add/extend Jasmine specs mirroring the equivalent `item` specs one-for-one (same filenames, under `frontend/specs/...`, mirroring `frontend/assets/js/...`'s structure): `GameClient/createDocumentSpec.js`, `GameDocumentNewSpec.js`, `GameDocumentSpec.js`, `GameDocumentsSpec.js` (button rendering), `GameDocumentNewController/*Spec.js`, `GameDocumentController/*Spec.js`, `GameDocumentsController/*Spec.js` (or wherever `can_create_document` ends up being resolved per Step 6), `documentListTypesSpec.js` (href builder), `HashRouteResolverSpec.js` (new route entries), `AppHelperSpec.js` (new page-key wiring).

## Files to Change

- `frontend/assets/js/client/GameClient.js`
- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/utils/requests/config/documentConfig.js`
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — new
- `frontend/assets/js/components/resources/document/pages/GameDocumentNew.jsx` — new
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js` — new
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js` — new
- `frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx` — new
- `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentNewHelper.jsx` — new
- `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentsHelper.jsx` — add "Create documents" button
- `frontend/assets/js/components/resources/document/pages/elements/show/*.jsx` — new (photo, name heading, title, name field, description field, hidden field, submit button)
- `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js` — new
- `frontend/assets/js/components/common/list_types/configs/documentListTypes.js` — `buildDocumentHref` for the game-scoped list
- Matching new/updated files under `frontend/specs/...`

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the `translator` agent's keys land; coordinate merge order or land both in the same PR

## Notes

- Confirm whether a shared/generic photo+name-heading element pair already exists that `item`'s `ItemPhoto`/`ItemNameHeading` and a new `document` variant could both use, before creating fully separate `Document*` element files — check `ShowPageLayout`'s other resource folders (`treasure`, `game`, `pc`, `npc`) for any such sharing pattern first.
- `can_create_document` must be resolved independently of `ListPage`'s built-in `canEdit` (same reasoning `GameItemsController.js`'s docstring gives for `can_create_item` vs `can_edit`) — do not reuse `ListPage`'s `onCanEditChange` for the button gate.
