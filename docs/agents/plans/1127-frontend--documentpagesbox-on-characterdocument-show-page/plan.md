# Plan: Frontend: DocumentPagesBox on CharacterDocument show page

Issue: [1127_frontend--documentpagesbox-on-characterdocument-show-page.md](../issues/1127-frontend--documentpagesbox-on-characterdocument-show-page.md)

## Overview
Wire the existing `DocumentPagesBox` component (issue #1126, `GameDocument` show page) onto the `CharacterDocument` show page. `DocumentPagesBox` stays untouched — it takes `game_slug`/`id` props where `id` means "`GameDocument` id" — so a new thin wrapper component, `CharacterDocumentPagesBox`, remaps the `CharacterDocument` show page's `game_document_id` context field to the `id` prop `DocumentPagesBox` expects, then delegates rendering to it. The wrapper is registered as the first `bottom` slot entry in `characterDocumentShowType.js`, above the existing files/photos shortlists — matching how `documentShowType.js` already places `DocumentPagesBox` above its own shortlists.

## Context
`CharacterDocument` is a thin join to `GameDocument` (`docs/agents/access-control/character-document.md`): its own show page (`characterDocumentShowType.js`) renders through `ShowPageLayout`, which spreads the raw `CharacterDocument` resource object (via `CharacterDocumentDetailHelper.render`) as props into every configured slot component. That spread's `id` is the `CharacterDocument`'s own row id — not the `GameDocument` id `DocumentPagesBox`/its controller need to call `/games/:slug/documents/:document_id/pages.json` — but the spread also already carries `game_document_id` (same field `RemoveDocumentTabController`/`AcquireDocumentTabController` already read off a `CharacterDocument`).

The pages endpoint itself already 404s when the underlying `GameDocument` is hidden, independent of any given `CharacterDocument`'s own `hidden` flag, and the `CharacterDocument` show page only ever reaches this component after its own (separately gated) detail fetch already succeeded — no new access-control surface here.

Both prerequisite sub-issues of parent #1124 are merged: backend `GameDocumentPage` read endpoints (#1125) and the `DocumentPagesBox` component on the `GameDocument` show page (#1126).

## Implementation Steps

### Step 1 — Add the `CharacterDocumentPagesBox` wrapper component
Create `frontend/assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBox.jsx`, mirroring how `CharacterDocumentFilesPreview.jsx`/`CharacterDocumentPhotosPreview.jsx` sit alongside their `Document*` counterparts, but simpler — no own controller/helper, since there's no new fetch/render logic, only prop remapping:

```jsx
import DocumentPagesBox from '../../../document/pages/elements/show/DocumentPagesBox.jsx';

export default function CharacterDocumentPagesBox({ game_slug: gameSlug, game_document_id: gameDocumentId }) {
  return <DocumentPagesBox game_slug={gameSlug} id={gameDocumentId} />;
}
```

Document the component (JSDoc, matching the sibling preview components' style) explaining why it exists: `DocumentPagesBox` is resource-agnostic and expects `id` to mean "`GameDocument` id", while the `CharacterDocument` show page's own spread `id` is the `CharacterDocument`'s row id — this wrapper is the seam that keeps `DocumentPagesBox` untouched.

### Step 2 — Wire it into `characterDocumentShowType.js`
Add `CharacterDocumentPagesBox` as the first `bottom` slot entry (`Show`-only, matching every other entry in this config — no edit/new mode exists for `CharacterDocument`), above `CharacterDocumentFilesPreview`/`CharacterDocumentPhotosPreview`:

```js
bottom: [
  { Show: CharacterDocumentPagesBox },
  { Show: CharacterDocumentFilesPreview },
  { Show: CharacterDocumentPhotosPreview },
],
```

Update the file's existing top-of-file doc comment to mention the new entry and why it leads the `bottom` slot (mirrors `documentShowType.js`'s own comment about `DocumentPagesBox` being "the document's actual content, more central than either" shortlist).

### Step 3 — Tests
- `frontend/specs/assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBoxSpec.js` — a thin render-only spec (mirroring `CharacterDocumentFilesPreviewSpec.js`'s SSR-only coverage pattern, adapted since this component has no fetch effect of its own to wait on) asserting it renders `DocumentPagesBox` with `id` set from `game_document_id` (not the `CharacterDocument`'s own `id`) and `game_slug` passed through unchanged.
- `frontend/specs/assets/js/components/common/show_page/show_types/configs/characterDocumentShowTypeSpec.js` — extend with cases mirroring `documentShowTypeSpec.js`'s own `DocumentPagesBox`-ordering assertions: `CharacterDocumentPagesBox` is present as a `Show`-only `bottom` entry, and it sits before both `CharacterDocumentFilesPreview` and `CharacterDocumentPhotosPreview` (index `0`).

No changes needed to `DocumentPagesBox`, `DocumentPagesBoxController`, `DocumentPagesBoxHelper`, or their existing specs — they stay resource-agnostic and untouched.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBox.jsx` — new wrapper component (create)
- `frontend/assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js` — import and register the new `bottom` slot entry, update doc comment
- `frontend/specs/assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBoxSpec.js` — new spec (create)
- `frontend/specs/assets/js/components/common/show_page/show_types/configs/characterDocumentShowTypeSpec.js` — extend with new-entry/ordering assertions

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Pure integration work — no backend, cache, or proxy changes; the cache navi config update for the `pages` sub-resource is a separate sibling sub-issue of #1124.
- Confirmed during refinement: a thin wrapper component is the chosen approach over generalizing `DocumentPagesBox`'s own props, specifically to avoid touching the already-shipped `GameDocument`-side component and its tests.
