# Plan: Frontend: DocumentPagesBox component on GameDocument show page

Issue: [1126-frontend--documentpagesbox-component-on-gamedocument-show-page.md](../../issues/1126-frontend--documentpagesbox-component-on-gamedocument-show-page.md)

## Overview

Add a new `DocumentPagesBox` component to the GameDocument show page: a collapsible, markdown-rendering box (styled after `DescriptionBox`) that reads a document's `GameDocumentPage`s one at a time, combining click-through pagination (reusing the existing `Pagination`/`PageLink` components) with scroll-triggered auto-load-and-append (new `IntersectionObserver`-based logic, no in-repo precedent). Wires the new `gameDocumentPage` resource into `RequestStore`'s permission-resolver auto-pick mechanism rather than a manual `AccessStore` check.

## Context

- Depends on #1125 (backend). Per the recorded decisions (`docs/agents/issues/1125-*`):
  - `GET games/:game_slug/documents/:document_id/pages.json` — public, 404 if parent document is hidden/missing.
  - `GET games/:game_slug/documents/:document_id/pages/all.json` — dm/admin only, works on hidden documents.
  - Both paginated via the standard engine: query params `page`/`per_page`; response headers `page`/`pages`/`per_page`/`total`.
  - Each item: `{ "id": <int>, "content": "<markdown>", "order": <int> }`, list ordered by `order` ascending.
- View-only in this sub-issue (no edit/preview).
- Related: #1131, filed during discussion, fixes `FactionCharactersPanel`'s pre-existing manual `AccessStore.ensureGamePermissions` call (a separate, already-existing inconsistency) and adds a permissions/RequestStore check to `docs/agents/issue-enhancement.md`. Not a blocker here, but this plan's new `gameDocumentPage` resolver should follow the corrected pattern from the start (see Step 1).

## Implementation Steps

### Step 1 — Register the `gameDocumentPage` resource

Add `frontend/assets/js/utils/requests/config/gameDocumentPageConfig.js`, mirroring `gameDocumentFileConfig.js`'s shape exactly (same `GameDocument`-scoped, `collection`-only shape) but with a real regular/private split, since (unlike files) pages must 404-on-hidden for the public endpoint and stay visible to dm/admin via `/all.json`:

```js
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/pages.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/pages/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
```

Register it in `resourceConfig.js`'s `RESOURCES` map as `gameDocumentPage`.

Add the matching entry to `RequestPermissionResolvers.js`'s `RESOLVERS`:

```js
gameDocumentPage: {
  collection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
},
```

This mirrors `document.single`'s `'game'`-kind branch (game-level `can_edit`, since `GameDocumentPage`s only ever belong to a game-level `GameDocument` in this sub-issue — `CharacterDocument` reuse is the dedicated sibling issue). This is the corrected pattern #1131 asks `FactionCharactersPanel` to catch up to — implement it right here from the start: `RequestStore.ensure` will auto-pick `regular`/`private` from this resolver, no manual `AccessStore` call needed in the component/controller.

### Step 2 — Controller: paging/window/segment bookkeeping

Add `frontend/assets/js/components/resources/document/pages/elements/show/controllers/DocumentPagesBoxController.js`. Responsibilities:

- Fetch a single page via `RequestStore.ensure({ resource: 'gameDocumentPage', quantityType: 'collection', params: { gameSlug, id: documentId }, query: { page, per_page } })`. Each distinct `query.page` produces its own promise (confirmed: `Request#ensure` keys its in-flight/settled promise by `[resource, quantityType, variant, params, query]`, so concurrent/sequential page fetches for the same document don't clobber each other).
- On mount, read `page` from the current hash (`HashQueryParams.parse(getCurrentHash())`, mirroring `FactionCharactersPanelController.fetchPage`) — default to `1` if absent.
  - If entering directly at `page=N` (`N > 1` or content is otherwise not yet loaded), fetch a small window with `per_page=4` centered so the previous page is already loaded before the user scrolls up (e.g. `page=max(1, N-1)&per_page=4`), then slice/keep only in-order results.
  - Otherwise (default entry), fetch `page=1&per_page=1`.
- Maintain state: `segments` (ordered array of `{ id, content, order }`, deduped/sorted by `order`), `loadedPages` (Set of page numbers already fetched, to prevent duplicate fetches on scroll), `totalPages` (from the `pages` response header/pagination metadata), `currentPage` (the pagination indicator — the page nearest the top of the visible scroll area).
- `loadNext()`: fetches `page = maxLoadedPage + 1, per_page: 1` if not already loaded and `maxLoadedPage < totalPages`, appends to `segments`.
- `loadPage(n)`: for explicit pagination-link clicks — if already loaded, just update `currentPage` and scroll the segment into view; otherwise fetch `page: n, per_page: 1` and replace/reset segments to start fresh from `n` (mirrors clicking a page link on the faction list — a fresh jump, not an append).
- Degrade to an empty box on fetch failure (mirroring `DocumentFilesPreviewController`'s catch-and-empty pattern), not a hard error, since a broken page reader must not block the rest of the show page.

### Step 3 — Component: scroll wiring

Add `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPagesBox.jsx`. Stateful, following `DescriptionBox.jsx`'s split (component owns refs/effects/state, helper is pure render):

- Props: `{ game_slug: gameSlug, id }` (same prop shape `DocumentFilesPreview`/`DescriptionBox` receive from `documentShowType.js`'s slot wiring).
- `boxRef` (scroll container) plus a `bottomSentinelRef` (empty div at the end of the loaded content).
- On mount: instantiate `DocumentPagesBoxController`, run its initial-load effect.
- `IntersectionObserver` #1, rooted at `boxRef.current`, observing `bottomSentinelRef`: on intersect, call `controller.loadNext()` and append.
- `IntersectionObserver` #2 (or one observer with multiple targets), rooted at `boxRef.current`, observing each rendered segment element: whichever segment is most visible updates `currentPage` (no fetch) — this is what satisfies "scrolling back up to a previously-loaded page updates the pagination indicator without refetching."
- Clicking a `Pagination`/`PageLink` navigates the hash (updates `?page=`); the component's effect reacts to the hash change (mirroring how `FactionCharactersPanelController.fetchPage` re-reads the hash) and calls `controller.loadPage(n)`.
- No existing scroll-fetch precedent exists anywhere in this codebase — this is genuinely new interaction logic; keep the observer/append logic isolated in the controller/component pair so it's unit-testable without a real DOM scroll.

### Step 4 — Helper: markdown rendering + pagination

Add `frontend/assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx`, following `DescriptionBoxHelper.jsx`'s shape:

- Returns `null` when there are no segments loaded yet (or the document has zero pages).
- Renders a bordered, scrollable box (`overflow-y: auto`, fixed max-height, own scroll — distinct from `DescriptionBox`'s collapse-on-overflow behavior) containing each loaded segment's `content` through `<ReactMarkdown remarkPlugins={[remarkBreaks]}>`, back-to-back with no visible boundary between segments, each wrapped in a ref'd element for the segment-visibility observer.
- The bottom sentinel `<div ref={bottomSentinelRef} />` after the last segment.
- Below the box: `<Pagination currentPage={currentPage} totalPages={totalPages} perPage={1} basePath={...} />`, reusing the existing component as-is — `basePath` built from the current game slug/document id, matching the faction list's own hash-template convention.

### Step 5 — Wire into the GameDocument show page

In `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`:
- Import `DocumentPagesBox`.
- Add `{ Show: DocumentPagesBox }` as the **first** entry of the `bottom` array, before `DocumentFilesPreview`/`DocumentPhotosPreview` — this is what "placed above the shortlists" resolves to structurally (`ShowPageLayout` renders `bottom` entries top-to-bottom).

### Step 6 — i18n

If the component surfaces any user-facing string (e.g. a fetch-error fallback, mirroring `faction_page.characters_panel_error`), add the key(s) to every locale file under `frontend/assets/i18n/` and run `npm run check_i18n` to confirm they stay in sync — following the same precedent as other panels that add their own error copy directly (no need to route this through a separate specialist for a couple of key additions).

### Step 7 — Tests

Add Jasmine specs mirroring the existing precedents:
- `gameDocumentPageConfig`/`resourceConfig`/`RequestPermissionResolvers` additions — extend their existing spec files the same way `gameDocumentFileConfig`/`document` entries are already covered.
- `DocumentPagesBoxController` — page/window fetching, dedup via `loadedPages`, append vs. reset-on-click-jump behavior, failure degrades to empty.
- `DocumentPagesBoxHelper` — renders null with no segments, renders markdown segments + `Pagination` with segments.
- `documentShowType.js` — `bottom` array now includes `DocumentPagesBox` first.

## Files to Change

- `frontend/assets/js/utils/requests/config/gameDocumentPageConfig.js` — new, GET.collection regular/private config.
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `gameDocumentPage`.
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — add `gameDocumentPage.collection` resolver.
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPagesBox.jsx` — new component.
- `frontend/assets/js/components/resources/document/pages/elements/show/controllers/DocumentPagesBoxController.js` — new controller.
- `frontend/assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx` — new helper.
- `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js` — wire in `DocumentPagesBox` as the first `bottom` entry.
- `frontend/assets/i18n/*.json` — only if new user-facing strings are added (see Step 6).
- Corresponding new/updated Jasmine spec files under each changed/added file's sibling `__tests__`/`*.test.jsx` location (follow this repo's existing per-file spec convention).

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`, only relevant if Step 6 adds strings)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- The scroll-triggered auto-load/append behavior (Step 3) has no existing precedent in this codebase (confirmed: no `IntersectionObserver` usage anywhere in `frontend/assets/js` prior to this issue) — budget real implementation/testing time for it, not just wiring.
- Backend field names (`id`/`content`/`order`) and endpoint paths are taken from the recorded decisions for #1125, which had not yet landed in the codebase as of this plan being written — confirm they still match once #1125 actually merges, before implementing Step 1.
- `RequestStore`'s `Request` cache key includes `query`, so per-page fetches for the same document naturally coexist without clobbering each other — no extra dedup layer needed beyond the controller's own `loadedPages` tracking (which exists to avoid *redundant* fetches, not to prevent clobbering).
- Do not copy `FactionCharactersPanelController`'s manual `AccessStore.ensureGamePermissions` call as precedent for endpoint selection (see #1131) — Step 1's resolver-based approach is the corrected pattern.
