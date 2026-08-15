## Problem
Documents are huge and currently only surface a single flat description. There's no UI to browse a document's content page by page on the GameDocument show page.

## Solution
Build the `DocumentPagesBox` component and wire it into the GameDocument show page.

- New collapsible box component, following the `DescriptionBoxHelper`/`DescriptionBox` precedent used for character description: a stateful component (`frontend/assets/js/components/common/misc/DescriptionBox.jsx`) owning scroll/measurement state, paired with a pure render helper (`DescriptionBoxHelper.jsx`) that renders markdown via `ReactMarkdown` with `remarkBreaks`
- Wired in as the first entry of `documentShowType.js`'s `bottom` array (`frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`), i.e. `{ Show: DocumentPagesBox }` before the existing `DocumentFilesPreview`/`DocumentPhotosPreview` entries — this is what "above the shortlists" resolves to structurally
- Backend contract (per #1125's decisions — see `docs/agents/issues/1125-*` — this sub-issue is blocked on that work landing, see Notes):
  - `GET games/:game_slug/documents/:document_id/pages.json` — public, 404 if the parent document doesn't exist or is hidden
  - `GET games/:game_slug/documents/:document_id/pages/all.json` — dm/admin only, returns pages even if the parent document is hidden
  - Both paginated via the existing engine: query params `page`/`per_page`, response headers `page`/`pages`/`per_page`/`total`
  - Each item: `{ "id": <int>, "content": "<markdown string>", "order": <int> }`, list always returned ordered by `order` ascending
- Endpoint selection (regular vs. `/all.json`) must go through the `RequestPermissionResolvers.js` / `RequestStore.ensure` auto-pick mechanism — add a `pages` resolver entry there, matching how `document`'s other quantity types (`collection`/`single`/`gameCollection`/etc.) already work — rather than the component manually calling `AccessStore.ensureGamePermissions`. (Note: `FactionCharactersPanel`'s manual `AccessStore.ensureGamePermissions` call is a separate, pre-existing inconsistency with this pattern, and is being fixed independently in #1131 — it is not the precedent to follow here.)
- The box has its own scroll and paginates internally by fetching `per_page=1&page=<N>` to get a single page's content plus the total page count from the `pages` response header
  - Below the box, standard pagination like `/#/game/:game_slug/factions/:id`'s character list pagination (reuse `Pagination`/`PageLink`/`PaginationController`/`PaginationBuilder`), changing the current page without reloading, updating the `page` query parameter in the URL hash
  - `per_page` is ignored/fixed at 1 for the steady-state fetch (see the deep-link exception below)
  - Scrolling to the end of the box loads the next page and appends its text (without unloading previously loaded text), and updates the pagination indicator to match
  - Scrolling back up to a previously-loaded page also updates the pagination indicator without refetching
  - **This scroll-to-load/append behavior has no existing precedent in this codebase** (no `IntersectionObserver` or scroll-triggered fetch pattern exists anywhere in the frontend today — confirmed by investigation) and is net-new interaction logic, likely an `IntersectionObserver` on a sentinel element at the box's bottom edge. Explicitly kept in scope per product decision (both click-through pagination and scroll-driven auto-load/append are required, kept in sync).
  - Internally, pages are tracked as separate segments (no visible UI boundary between them) so the component knows which pages are loaded and in what order
  - Entering the document directly at a given page (e.g. `?page=2`) loads a small window around that page (e.g. `per_page=4`) so that scrolling up loads the previous page correctly, and results are appended in the correct order — the component tracks which pages have already been loaded
- Rendering uses markdown, matching the character description precedent (view-only in this sub-issue — no edit/preview here)

## Notes
This is sub-issue 2/5 of #1124. Depends on the backend `GameDocumentPage` read endpoints sub-issue (#1125). Sibling sub-issues:
- Backend: `GameDocumentPage` model + read endpoints (#1125)
- Frontend: reuse of `DocumentPagesBox` on the CharacterDocument show page
- Cache: navi config update for the new paginated `pages` sub-resource
- Edit/Create GameDocumentPages (left vague, to be matured separately)

Related: #1131 (fix `FactionCharactersPanel`'s manual permission check to go through `RequestStore`, and add a permissions/RequestStore check to `docs/agents/issue-enhancement.md`) — split out during discussion of this issue; not a blocker for this sub-issue, but the `pages` resolver added here should follow the corrected pattern from the start.

Parent issue: #1124
