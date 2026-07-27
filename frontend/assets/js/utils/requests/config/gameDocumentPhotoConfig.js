/**
 * GET resource configuration for `gameDocumentPhoto` (issue #873): a `GameDocument`'s own
 * `GameDocumentPhoto` records, listed on the document detail page's photo shortlist and its
 * full paginated list page.
 *
 * @description `collection` params: `gameSlug`, `id` (the `GameDocument`'s own id, not a
 *   photo id) — mirrors `documentConfig.js`'s `GET.single` shape (params-wise), not its
 *   `GET.collection` (which is character-scoped and takes a `kind`), since a document's photos
 *   are scoped directly to the `GameDocument` itself. Its `private` variant
 *   (`/photos/all.json`) is `GameEditPermission`-gated (game-level `can_edit`), resolved via
 *   `AccessStore.ensureGamePermissions(gameSlug)` — same permission source as
 *   `documentConfig.js`'s own `GET.single.private`.
 */
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photos.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photos/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
