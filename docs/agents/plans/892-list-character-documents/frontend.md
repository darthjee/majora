# Frontend Plan: List Character Documents

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on the backend agent's new endpoints and fields exactly as described in
[plan.md](plan.md)'s "Shared contracts" — in particular: no `description` field exists on
`CharacterDocument` at any tier, so the new show page must not attempt to render one (unlike
`CharacterItem`'s show page). Also depends on the translator agent's new i18n keys (see
[translator.md](translator.md)) for all new page copy — do not hardcode English strings.

## Implementation Steps

### Step 1 — Extend `documentConfig.js`'s `single` to branch on `kind`

Currently `GET.single` only has a `kind: 'game'` family. Add a `'pcs'|'npcs'` family, mirroring
`itemConfig.js`'s `characterSinglePath`/`characterSingleFullPath` exactly:

```js
const characterSinglePath = ({ gameSlug, kind, id, documentId }) =>
  `/games/${gameSlug}/${kind}/${id}/documents/${documentId}.json`;
const characterSingleFullPath = ({ gameSlug, kind, id, documentId }) =>
  `/games/${gameSlug}/${kind}/${id}/documents/${documentId}/full.json`;
```

`single.regular.path`/`single.private.path` branch on `params.kind === 'game'` exactly like
`itemConfig.js` does. Update the file's own doc comment (it currently explicitly says "only the
`kind: 'game'` family exists so far... unlike `itemConfig.js`'s dual-family `single` branching" —
that sentence becomes false).

### Step 2 — Build the CharacterDocument detail controller and show page

Mirror `CharacterItemDetailController.js`/`CharacterItem.jsx`, but much simpler — no photo upload,
no edit button (documents have neither an edit page nor a `can_edit`-gated action once flavor
fields are gone):

- `frontend/assets/js/components/resources/character/pages/controllers/CharacterDocumentDetailController.js`
  — fetches via `RequestStore.ensure({resource: 'document', quantityType: 'single', params:
  {gameSlug, kind: characterKind, id: characterId, documentId}})`, picking regular vs. `full.json`
  by the character-level `can_edit` permission (`AccessStore.ensureCharacterPermissions`), same
  pattern as the item controller minus the `canEdit`/`canUploadPhoto` setters (documents have no
  edit action to gate).
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocument.jsx` — shared
  PC/NPC show page, loads via the controller above and renders through a new `DocumentDetailHelper`
  (see Step 3). No `PhotoUploadModal`, no edit href.
- `frontend/assets/js/components/resources/character/pages/PcCharacterDocument.jsx` /
  `NpcCharacterDocument.jsx` — one-line wrappers, mirroring `PcCharacterItem.jsx`/
  `NpcCharacterItem.jsx` exactly (`<CharacterDocument characterKind="pcs|npcs" />`).

### Step 3 — Rendering: do not reuse `documentShowType`

`showTypeConfig.js`'s existing `document` entry (`documentShowType.js`) is the `GameDocument`
show/new/edit page — it has a description field and photo/file preview sections that
`CharacterDocument` doesn't have data for. Do not point the new page at it. Instead:

- Add a small `DocumentDetailHelper.jsx` (mirroring `ItemDetailHelper.jsx`'s shape but without the
  `canEdit`/`canUploadPhoto` params) that renders through `ShowPageLayout` with a **new**,
  deliberately minimal show-type entry — e.g. register `character_document:
  characterDocumentShowType` in `showTypeConfig.js`, where `characterDocumentShowType` only has a
  `left` (photo + name heading, reusing/adapting `DocumentPhoto`/`DocumentNameHeading` if they
  don't assume `GameDocument`-only data, else new lean elements) and empty `right`/`bottom` — no
  description box, no photos/files preview.
- If reusing `DocumentPhoto`/`DocumentNameHeading` turns out awkward (they may assume a
  `GameDocument`-shaped object with fields `CharacterDocument`'s payload doesn't have, e.g. if they
  read `description`), write new, smaller elements instead rather than forcing the fit.

### Step 4 — Routing

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: add, near the existing
  `.../documents` (list) rows:
  ```js
  ['/games/:game_slug/npcs/:character_id/documents/:id', 'npcCharacterDocument'],
  ['/games/:game_slug/pcs/:character_id/documents/:id', 'pcCharacterDocument'],
  ```
  (placed before the plural `.../documents` row on each side, same ordering convention items use —
  more specific paths before less specific ones).
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import `PcCharacterDocument`/
  `NpcCharacterDocument` and add `pcCharacterDocument: <PcCharacterDocument />` /
  `npcCharacterDocument: <NpcCharacterDocument />` to the route-element map, next to the existing
  `pcCharacterDocuments`/`npcCharacterDocuments` entries.

### Step 5 — Wire up the list-page click-through

`frontend/assets/js/components/common/list_types/configs/documentListTypes.js`:
- Replace `buildCharacterDocumentHref()` (always `null`) with a per-kind curried function
  mirroring `listTypeConfig.js`'s `buildCharacterItemItemHref`:
  ```js
  function buildCharacterDocumentItemHref(characterKind) {
    return function buildHref(item, context) {
      return `#/games/${context.gameSlug}/${characterKind}/${context.characterId}/documents/${item.data.id}`;
    };
  }
  ```
- Update `'pc-documents'`/`'npc-documents'` entries' `buildItemHref` to
  `buildCharacterDocumentItemHref('pcs')`/`('npcs')` respectively (currently both point at the
  same no-op function).
- Check whether `context.characterId` is already threaded into this list type's context the same
  way `CharacterItemsHelper` threads it for items (per `buildCharacterItemItemHref`'s own doc
  comment) — if not, the character-documents list helper needs the same wiring.

### Step 6 — Wire up the PC/NPC show-page shortlist click-through

- `frontend/assets/js/components/common/cards/shortListResourceConfig.js`: flip the `document`
  entry's `action` from `'none'` to `'navigate'`, add a `buildHref`, and pass `href` into
  `renderItem` — mirroring the `item` entry immediately above it line-for-line.
- `frontend/assets/js/components/common/cards/DocumentPreviewCard.jsx` +
  `helpers/DocumentPreviewCardHelper.jsx`: add an optional `href` prop and the same
  `#wrapWithLink`-style conditional anchor wrap, mirroring `ItemPreviewCard.jsx`/
  `ItemPreviewCardHelper.jsx` exactly. Update both files' doc comments (they currently explicitly
  state documents have no detail page / are not links — both statements become false).

### Step 7 — Tests

Add Jasmine specs (mirroring the existing `CharacterItem`/`ItemDetailHelper`/
`CharacterItemDetailController` spec files 1:1) for every new/changed file above: the new
controller, show page, wrapper pages, `DocumentDetailHelper`, the `documentConfig.js` `single`
branching, the `buildCharacterDocumentItemHref` change, and the `DocumentPreviewCard`/
`shortListResourceConfig` href wiring.

## Files to Change

- `frontend/assets/js/utils/requests/config/documentConfig.js` — extend `single`
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterDocumentDetailController.js` — new
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocument.jsx` — new
- `frontend/assets/js/components/resources/character/pages/PcCharacterDocument.jsx` — new
- `frontend/assets/js/components/resources/character/pages/NpcCharacterDocument.jsx` — new
- `frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx` (or
  wherever fits the resource-folder convention for a *character*-scoped document detail helper) —
  new
- `frontend/assets/js/components/common/show_page/show_types/showTypeConfig.js` +
  `configs/characterDocumentShowType.js` — new show-type entry
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add two routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register two new route elements
- `frontend/assets/js/components/common/list_types/configs/documentListTypes.js` — real
  `buildItemHref` for `pc-documents`/`npc-documents`
- `frontend/assets/js/components/common/cards/shortListResourceConfig.js` — `document` entry
  `action: 'navigate'` + `buildHref`
- `frontend/assets/js/components/common/cards/DocumentPreviewCard.jsx` +
  `helpers/DocumentPreviewCardHelper.jsx` — add `href` support
- Corresponding spec files under `frontend/specs/` mirroring every path above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — after the translator agent's keys
  land

## Notes

- Coordinate the exact i18n key names with the translator agent (see
  [translator.md](translator.md)) before finalizing `DocumentDetailHelper`'s `Translator.t()`
  calls — same coordination note the `275-and-photos-index` plan used for an analogous
  frontend/translator split.
- No acquire/remove/photo-upload/edit functionality is in scope — `CharacterDocument` has nothing
  left to edit once flavor fields are removed, matching the issue's explicit page list (list + show
  only).
