/**
 * GET resource configuration for `gameDocumentFile` (issue #873): a `GameDocument`'s own
 * `GameDocumentFile` records, listed on the document detail page's file shortlist and its full
 * paginated list page.
 *
 * @description `collection` params: `gameSlug`, `id` (the `GameDocument`'s own id, not a file
 *   id) — mirrors `gameDocumentPhotoConfig.js`'s own shape exactly, just pointing at
 *   `files.json`/`files/all.json` instead of `photos.json`/`photos/all.json`. Its `private`
 *   variant is `GameEditPermission`-gated (game-level `can_edit`), same as the photo config.
 */
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/files.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/files/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
