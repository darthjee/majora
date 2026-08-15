/**
 * GET resource configuration for `gameDocumentPage` (issue #1126): a `GameDocument`'s own
 * `GameDocumentPage` records, read one page at a time by `DocumentPagesBox` on the document
 * detail page.
 *
 * @description `collection` params: `gameSlug`, `id` (the `GameDocument`'s own id, not a page
 *   id) — mirrors `gameDocumentFileConfig.js`'s own shape, just pointing at `pages.json`/
 *   `pages/all.json` instead of `files.json`/`files/all.json`. Unlike files, the `regular`
 *   variant 404s outright when the parent `GameDocument` is hidden (or missing), while the
 *   `private` variant (`GameEditPermission`-gated, game-level `can_edit`) still returns pages for
 *   a hidden document — see #1125's recorded decisions.
 */
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
