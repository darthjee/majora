# Issue: Frontend: DocumentPagesBox on CharacterDocument show page

## Problem
The `CharacterDocument` show page needs the same paginated document-pages browsing experience as the `GameDocument` show page, but sourced from the underlying `GameDocument` rather than the `CharacterDocument` itself.

## Solution
Reuse the existing `DocumentPagesBox` component (built in #1126 for the `GameDocument` show page) on the `CharacterDocument` show page, wired through `characterDocumentShowType.js`:

- Same behavior as the `GameDocument` show page: collapsible box above the files/photos shortlists, own scroll, bidirectional infinite-scroll pagination, markdown rendering
- Key the requests off the underlying `GameDocument` id, not the `CharacterDocument` id — `CharacterDocument` is a thin join to `GameDocument` (see `docs/agents/access-control/character-document.md`), so the pages endpoints (`/games/:game_slug/documents/:document_id/pages.json` / `/pages/all.json`) must be called with `game_document_id`, not the `CharacterDocument`'s own `id`
- `DocumentPagesBox` itself takes `game_slug`/`id` props (meaning "`GameDocument` id") and stays untouched and resource-agnostic; a new thin wrapper component under `resources/character/pages/elements/show/` (mirroring how `CharacterDocumentFilesPreview`/`CharacterDocumentPhotosPreview` already mirror their `Document*` counterparts) remaps `ShowPageLayout`'s spread context — `game_document_id` -> `id` — before delegating to `DocumentPagesBox`. Confirmed approach: a wrapper component, not a change to `DocumentPagesBox`'s own props (which would touch the already-shipped `GameDocument`-side component and its tests)
- No new component logic expected here beyond wiring — this should mostly be integration work
- No access-control gap: `/games/:slug/documents/:document_id/pages.json` already 404s if the underlying `GameDocument` itself is hidden (independent of any given `CharacterDocument`'s own `hidden` flag), matching the `GameDocument` show page's own gating; the `CharacterDocument` show page also only ever reaches this component after its own detail fetch already succeeded

## Benefits
Players and DMs get the same in-place, paginated document reading experience from a PC/NPC's document list as they already get from the game's own document list, with no extra navigation.

## Notes
This is sub-issue 3/5 of #1124. Both dependencies are now merged:
- Backend: `GameDocumentPage` model + read endpoints (#1125, merged)
- Frontend: `DocumentPagesBox` component wired into the `GameDocument` show page (#1126, merged)

Sibling sub-issues:
- Cache: navi config update for the new paginated `pages` sub-resource
- Edit/Create GameDocumentPages (left vague, to be matured separately)

Parent issue: #1124
