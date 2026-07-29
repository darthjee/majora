# Frontend Plan: Add photos and file shortlist for character document

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the exact endpoint paths, response fields, and
resource-config keys (`characterDocumentFile`/`characterDocumentPhoto`) this agent depends on the
backend agent producing. `CharacterDocumentSerializer` gains a `description` field this plan
relies on.

## Implementation Steps

### Step 1 — `GameDocument` show page: reorder + dedicated limit constant

In `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`,
swap the `bottom` array order so files come first:

```js
bottom: [
  { Show: DocumentFilesPreview },
  { Show: DocumentPhotosPreview },
],
```

**Do not** bump `MAX_PREVIEW_PHOTOS` directly — it's also imported by
`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx`
for an unrelated character-photo preview section that the issue never mentions changing. Instead,
in `frontend/assets/js/components/common/cards/characterPreviewConstants.js`:
- Add `export const MAX_PREVIEW_DOCUMENT_PHOTOS = 17;` (new).
- Rename `MAX_PREVIEW_FILES` to `MAX_PREVIEW_DOCUMENT_FILES = 17` (safe to rename in place — it's
  only imported by `DocumentFilesPreviewController.js` today, per current grep).
- Update `DocumentPhotosPreviewController.js`/`DocumentFilesPreviewController.js` imports
  accordingly. Leave `MAX_PREVIEW_PHOTOS` at `11`, untouched.

### Step 2 — New resource configs

Add `frontend/assets/js/utils/requests/config/characterDocumentFileConfig.js` and
`characterDocumentPhotoConfig.js`, mirroring `gameDocumentFileConfig.js`/`gameDocumentPhotoConfig.js`
but with the extra character-scope path segment and params `gameSlug`, `kind`, `characterId`,
`documentId`:

```js
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, kind, characterId, documentId }) =>
          `/games/${gameSlug}/${kind}/${characterId}/documents/${documentId}/files.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, kind, characterId, documentId }) =>
          `/games/${gameSlug}/${kind}/${characterId}/documents/${documentId}/files/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
```

(photos config: same shape, `photos.json`/`photos/all.json`). Register both as
`characterDocumentFile`/`characterDocumentPhoto` in
`frontend/assets/js/utils/requests/resourceConfig.js`, alongside the existing `gameDocumentFile`/
`gameDocumentPhoto` entries.

### Step 3 — New preview component pair

Add, under `frontend/assets/js/components/resources/character/pages/elements/show/` (new
`show/` subfolder mirroring the document resource's own layout), a
`CharacterDocumentFilesPreview`/`CharacterDocumentPhotosPreview` pair — each a
component + controller + helper — copied from
`frontend/assets/js/components/resources/document/pages/elements/show/DocumentFilesPreview.jsx`
(and its `controllers/DocumentFilesPreviewController.js`, `helpers/DocumentFilesPreviewHelper.jsx`)
and the `Photos` sibling, with these differences:
- Controller's `RequestStore.ensure()` call uses `resource: 'characterDocumentFile'` /
  `'characterDocumentPhoto'`, `params: { gameSlug, kind, characterId, documentId }` (not just
  `gameSlug, id`), and `query: { per_page: MAX_PREVIEW_DOCUMENT_FILES }` /
  `MAX_PREVIEW_DOCUMENT_PHOTOS`.
- Component props: `game_slug`, `kind`, `character_id`, `id` (the `CharacterDocument`'s own id —
  matches the field already present on the fetched `document` object).
- "See all" href: `#/games/${gameSlug}/${kind}/${characterId}/documents/${id}/files` (and
  `/photos`) — confirm these full-list pages exist for `CharacterDocument`; if not, check with the
  file-list-page precedent from issue #892/#873 or scope the "See all" card out for this issue if
  no full-list route exists yet (the issue only asks for shortlists, not full-list pages).

Reuse the existing `DocumentFileCard`/`SeeAllCard` render primitives from
`frontend/assets/js/components/common/cards/` — no new card components needed.

### Step 4 — Wire into `CharacterDocument` show page

In `frontend/assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js`,
add a description box to `right` and the two new previews to `bottom`:

```js
right: [{ Show: DescriptionBox }],
bottom: [
  { Show: CharacterDocumentFilesPreview },
  { Show: CharacterDocumentPhotosPreview },
],
```

(`DescriptionBox` already exists — same component `documentShowType.js` reuses — reads `description`
off the spread context, which Step 5 below ensures is present.)

In `frontend/assets/js/components/resources/character/pages/helpers/CharacterDocumentDetailHelper.jsx`,
`render()` currently only spreads `{ ...document }` into `ShowPageLayout`'s `context`. Extend its
signature to accept `gameSlug`/`characterKind`/`characterId` and merge them in:

```js
static render(document, backHref, gameSlug, characterKind, characterId) {
  return (
    <ShowPageLayout
      type="character_document"
      mode="show"
      backHref={backHref}
      context={{ ...document, game_slug: gameSlug, kind: characterKind, character_id: characterId }}
    />
  );
}
```

Update the one call site in
`frontend/assets/js/components/resources/character/pages/shared/CharacterDocument.jsx` (which
already computes `gameSlug`/`characterId`/has `characterKind` in scope) to pass the three extra
args.

### Step 5 — Update stale doc comments

`characterDocumentShowType.js`'s and `CharacterDocumentDetailHelper.jsx`'s existing docstrings
explicitly say `CharacterDocument` has no description/shortlists and deliberately doesn't mirror
`documentShowType` — update both comments so they no longer contradict the new behavior.

## Files to Change

- `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js` —
  reorder `bottom`.
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — add
  `MAX_PREVIEW_DOCUMENT_PHOTOS`, rename `MAX_PREVIEW_FILES` → `MAX_PREVIEW_DOCUMENT_FILES`, both
  set to 17.
- `frontend/assets/js/components/resources/document/pages/elements/show/controllers/DocumentPhotosPreviewController.js`,
  `DocumentFilesPreviewController.js` — updated constant imports.
- `frontend/assets/js/utils/requests/config/characterDocumentFileConfig.js` — new.
- `frontend/assets/js/utils/requests/config/characterDocumentPhotoConfig.js` — new.
- `frontend/assets/js/utils/requests/resourceConfig.js` — register the two new resources.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterDocumentFilesPreview.jsx`
  (+ `controllers/`, `helpers/`) — new.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterDocumentPhotosPreview.jsx`
  (+ `controllers/`, `helpers/`) — new.
- `frontend/assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js` —
  add `right`/`bottom` entries.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterDocumentDetailHelper.jsx` —
  extend `render()` signature/context.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocument.jsx` — pass
  new args to `render()`.
- `frontend/assets/js/i18n/*` (all locales) — new translation keys for the character document
  files/photos preview titles/empty-states, mirroring `document_page.files_title` and
  `game_document_files_preview.empty` (delegate to the `translator` agent if this project splits
  that work out).
- `frontend/specs/...` — Jasmine specs mirroring the existing `DocumentFilesPreview`/
  `DocumentPhotosPreview` specs, plus updated specs for `CharacterDocumentDetailHelper`/
  `characterDocumentShowType`.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — required once new translation
  keys are added.

## Notes

- Confirm whether a full-list page (`.../documents/:id/files`, `.../documents/:id/photos`) needs
  to exist for `CharacterDocument` before wiring a "See all" card into the new previews — the issue
  only asks for shortlists; if no such route exists yet, either scope it out of the "See all" card
  or add minimal full-list pages mirroring the `GameDocument` ones (`DocumentFiles`/`DocumentPhotos`
  pages) — treat as in-scope only if the shortlist's "See all" card would otherwise 404.
- The `translator` agent should be looped in for the new i18n keys if this project routes
  translation-only work through it rather than having `frontend` touch `i18n/` directly.
