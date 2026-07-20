# Frontend Plan: Add game documents and character game documents

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint list/response shapes
(produced by backend), the i18n keys this plan must call `Translator.t(...)` with (produced by
translator), and the endpoint-path/shortlist-size contract infra's Navi config depends on.

## Implementation Steps

### Step 1 — Icon and placeholder asset

- `frontend/assets/js/utils/ui/Icons.js` — add `folder: 'bi-folder'`.
- `frontend/assets/images/placeholders/default_document.png` — new placeholder image (a
  minimalistic book with a scroll and a few loose pages of paper coming out of it), parallel to
  `default_item.png`. Source or generate this asset as part of this step.

### Step 2 — Card image component

Add `frontend/assets/js/components/common/cards/CardDocumentImage.jsx`, mirroring
`CardItemImage.jsx` exactly (imports `default_document.png`, falls back to it when `url` is
falsy). Register it in `frontend/assets/js/components/common/misc/ActionsOverlay.jsx`'s type map
(`document: CardDocumentImage`, alongside `treasure`/`item`).

### Step 3 — List-item wrapper classes

Add `frontend/assets/js/components/common/list_types/GameDocumentListItem.js` and
`CharacterDocumentListItem.js`, mirroring `GameItemListItem.js`/`CharacterItemListItem.js`
(both just expose a `hidden` getter over `BaseListItem`).

### Step 4 — API client methods

`frontend/assets/js/client/CharacterClient.js` — add `fetchCharacterDocuments(characterKind,
gameSlug, characterId, token, perPage = PREVIEW_PAGE_SIZE)`, mirroring `fetchCharacterItems`
(delegates to the private `#fetchCharacter(..., 'documents', ...)` helper).

`frontend/assets/js/components/common/list_types/listTypeConfig.js` — add:
- `fetchGameDocuments(gameSlug, hashResolver, client)`, mirroring `fetchGameItems` (permission-gated
  between `/documents.json`/`/documents/all.json`).
- `buildFetchCharacterDocuments(characterKind)`, mirroring `buildFetchCharacterItems`
  (permission-gated between `/documents.json`/`/documents/all.json` at the character level).
- New list-type entries `documents`, `pc-documents`, `npc-documents` (mirroring `items`/
  `pc-items`/`npc-items`), each with `wrapperClass: GameDocumentListItem` /
  `CharacterDocumentListItem`, `photoType: 'document'`, hidden-badge `buildInfoBarItems` (reuse
  the same helper pattern `ItemCardHelper` uses), and `buildItemHref` pointing at the new list
  pages (no detail page, so this should link to the list, not a per-document page — check how
  other no-detail-page list types, if any, handle `buildItemHref`, or omit a per-row link if the
  existing helper requires one to be non-null).

### Step 5 — Preview (shortlist) wiring

- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — add
  `PREVIEW_LIST_TYPES.document = { titleKey: 'character_page.documents_title', icon:
  Icons.folder }`.
- Add `frontend/assets/js/components/common/cards/DocumentPreviewCard.jsx` +
  `helpers/DocumentPreviewCardHelper.jsx`, mirroring `ItemPreviewCard.jsx`/
  `ItemPreviewCardHelper.jsx` (read-only, non-link card using `CardDocumentImage`).
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` —
  add a `PreviewSection` for documents, positioned **beneath** the existing items `PreviewSection`
  (per the issue), fed by `character.documents ?? []`, `title` from
  `PREVIEW_LIST_TYPES.document.titleKey`, `seeAllHref` = `` `#/games/${character.game_slug}/${segment}/${character.id}/documents` ``,
  `emptyText` from `character_documents_preview.empty`, rows via `<DocumentPreviewCard
  key={document.id} document={document} />`. Update the JSDoc `@param` block the same way the
  existing `items`/`treasures` params are documented.

### Step 6 — Fetch + merge into character state

`frontend/assets/js/components/resources/character/pages/controllers/CharacterListsController.js`
— add `fetchCharacterDocuments(gameSlug, characterId, token)` and
`fetchAndMergeDocuments(character, params, token)`, mirroring `fetchCharacterItems`/
`fetchAndMergeItems` (merges onto `character.documents` via `CharacterListMerger`, degrading to
`[]` on failure).

`frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` —
in the load chain (currently `...fetchAndMergeTreasures → fetchAndMergeItems →
fetchAndMergePhotos → fetchAndMergeGameType → fetchAndMergeAccess`), insert
`.then((character) => this.fetchAndMergeDocuments(character, params, token))` right after
`fetchAndMergeItems`.

### Step 7 — List pages

- `frontend/assets/js/components/resources/document/pages/GameDocuments.jsx` +
  `helpers/GameDocumentsHelper.jsx`, mirroring `GameItems.jsx`/`GameItemsHelper.jsx` (thin page,
  delegates rendering/data-fetching to the helper + shared list-page machinery, list-type key
  `documents`).
- `frontend/assets/js/components/resources/character/pages/PcCharacterDocuments.jsx` /
  `NpcCharacterDocuments.jsx`, mirroring `PcCharacterItems.jsx`/`NpcCharacterItems.jsx` (thin
  wrappers around a shared `shared/CharacterDocuments.jsx`, parameterized by `characterKind`/
  `listType` = `'pc-documents'`/`'npc-documents'`).
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocuments.jsx` +
  `helpers/CharacterDocumentsHelper.jsx`, mirroring `shared/CharacterItems.jsx`/
  `CharacterItemsHelper.jsx`.

No `GameDocument.jsx`, `CharacterDocument.jsx`, or `CharacterDocumentNew.jsx` — no detail/create
pages in this issue.

### Step 8 — Routing

`frontend/assets/js/utils/routing/HashRouteResolver.js` — add to the `ROUTES` array:
```js
['/games/:game_slug/documents', 'gameDocuments'],
['/games/:game_slug/pcs/:character_id/documents', 'pcCharacterDocuments'],
['/games/:game_slug/npcs/:character_id/documents', 'npcCharacterDocuments'],
```
(no `/:id` detail routes)

`frontend/assets/js/components/helpers/AppHelper.jsx` — import and register in `PAGES`:
`gameDocuments: <GameDocuments />`, `pcCharacterDocuments: <PcCharacterDocuments />`,
`npcCharacterDocuments: <NpcCharacterDocuments />`.

### Step 9 — Header nav links

`frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`:
- `renderGameNavLinks` — add a `<NavDropdown.Item href={'#/games/'+gameSlug+'/documents'}>`
  using `Translator.t('game_page.documents')`, next to the existing items link.
- `renderCharacterNavLinks` — add a `<NavDropdown.Item href={base+'/documents'}>` using
  `Translator.t('character_page.documents_title')`, next to the existing items link.

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — new `folder` icon
- `frontend/assets/images/placeholders/default_document.png` — new placeholder asset
- `frontend/assets/js/components/common/cards/CardDocumentImage.jsx`,
  `DocumentPreviewCard.jsx`, `helpers/DocumentPreviewCardHelper.jsx` — new card components
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — register `document` photo type
- `frontend/assets/js/components/common/list_types/GameDocumentListItem.js`,
  `CharacterDocumentListItem.js`, `listTypeConfig.js` — new list-type wiring
- `frontend/assets/js/client/CharacterClient.js` — new `fetchCharacterDocuments`
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — new
  `PREVIEW_LIST_TYPES.document`
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — new
  documents `PreviewSection`
- `frontend/assets/js/components/resources/character/pages/controllers/
  CharacterListsController.js`, `CharacterController.js` — fetch + merge `character.documents`
- `frontend/assets/js/components/resources/document/pages/GameDocuments.jsx`,
  `helpers/GameDocumentsHelper.jsx` — new game-level list page
- `frontend/assets/js/components/resources/character/pages/PcCharacterDocuments.jsx`,
  `NpcCharacterDocuments.jsx`, `shared/CharacterDocuments.jsx`,
  `helpers/CharacterDocumentsHelper.jsx` — new PC/NPC list pages
- `frontend/assets/js/utils/routing/HashRouteResolver.js`,
  `frontend/assets/js/components/helpers/AppHelper.jsx` — new routes
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — new nav links

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks` →
  "Check JS Lint")
- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes

- This plan calls `Translator.t()` with keys that don't exist until the translator agent's work
  lands (`game_page.documents`, `character_page.documents_title`,
  `character_documents_preview.empty`, `game_documents_page.*`, `character_documents_page.*`) —
  coordinate landing order or land both in the same PR.
- `buildItemHref` for the new list-type entries needs a concrete decision once you look at
  `listTypeConfig.js`'s existing helper signature — since there's no per-document detail page,
  check whether `null`/omitted is an accepted value or whether the row should just not be a link
  (no `href`) for now.
