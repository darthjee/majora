const pagesCollectionPath = ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/pages.json`;
const pagesCollectionAllPath = ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/pages/all.json`;

const pageSinglePath = ({ gameSlug, id, pageId }) => `/games/${gameSlug}/documents/${id}/pages/${pageId}.json`;
const pageSingleAllPath = ({ gameSlug, id, pageId }) => (
  `/games/${gameSlug}/documents/${id}/pages/${pageId}/all.json`
);

const bumpVersionPath = ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/pages/bump_version.json`;
const bumpVersionAllPath = ({ gameSlug, id }) => (
  `/games/${gameSlug}/documents/${id}/pages/bump_version/all.json`
);

/**
 * GET/mutation resource configuration for `gameDocumentPage` (issue #1126, mutations added in
 * #1129): a `GameDocument`'s own `GameDocumentPage` records, read one page at a time by
 * `DocumentPagesBox` on the document detail page, created/updated/trimmed/version-bumped by
 * `DocumentPagesEditBox` on the document edit page.
 *
 * @description `GET.collection` params: `gameSlug`, `id` (the `GameDocument`'s own id, not a page
 *   id) — mirrors `gameDocumentFileConfig.js`'s own shape, just pointing at `pages.json`/
 *   `pages/all.json` instead of `files.json`/`files/all.json`. Unlike files, the `regular`
 *   variant 404s outright when the parent `GameDocument` is hidden (or missing), while the
 *   `private` variant (`GameEditPermission`-gated, game-level `can_edit`) still returns pages for
 *   a hidden document — see #1125's recorded decisions. `DocumentPagesEditBox` also uses this
 *   same `GET.collection` entry to fetch a document's *entire* current content (all pages, not
 *   paginated) up front when entering pages edit mode, via a large `per_page` query value —
 *   no separate "all pages" GET entry is needed since the paginator has no upper `per_page` cap.
 *
 *   `POST.collection`/`DELETE.collection` (page create / bulk trim) reuse the exact same
 *   `pages.json`/`pages/all.json` paths as `GET.collection` — the backend dispatches by HTTP
 *   method on the same URL (see `plan.md`'s shared-contract table). `POST` params: `gameSlug`,
 *   `id`; body `{content, order, version}`. `DELETE` params: `gameSlug`, `id`; body `{keep}`.
 *
 *   `PATCH.single` (per-page update) targets `pages/:page_id.json`/`pages/:page_id/all.json`.
 *   Params: `gameSlug`, `id` (the `GameDocument`'s own id), `pageId`. Body: `{content, version}`.
 *
 *   `PATCH.bumpVersion` (batch version bump for every page not otherwise touched by a save)
 *   targets `pages/bump_version.json`/`pages/bump_version/all.json`. Params: `gameSlug`, `id`.
 *   Body: `{version, exclude_ids}`.
 *
 *   Every mutation variant's `permission` is `'can_edit'` for documentation purposes only —
 *   `DocumentPagesEditBoxController` always calls `RequestStore.mutate` with an explicit
 *   `variantName`, resolved once per save (via `RequestPermissionResolvers.resolve('gameDocumentPage',
 *   'collection', ...)`) rather than letting each individual mutate call re-resolve permissions on
 *   its own — see `docs/agents/issue-enhancement.md`'s documented `variantName` convention.
 */
export default {
  GET: {
    collection: {
      regular: { path: pagesCollectionPath, permission: null },
      private: { path: pagesCollectionAllPath, permission: 'can_edit' },
    },
  },
  POST: {
    collection: {
      regular: { path: pagesCollectionPath, permission: 'can_edit' },
      private: { path: pagesCollectionAllPath, permission: 'can_edit' },
    },
  },
  PATCH: {
    single: {
      regular: { path: pageSinglePath, permission: 'can_edit' },
      private: { path: pageSingleAllPath, permission: 'can_edit' },
    },
    bumpVersion: {
      regular: { path: bumpVersionPath, permission: 'can_edit' },
      private: { path: bumpVersionAllPath, permission: 'can_edit' },
    },
  },
  DELETE: {
    collection: {
      regular: { path: pagesCollectionPath, permission: 'can_edit' },
      private: { path: pagesCollectionAllPath, permission: 'can_edit' },
    },
  },
};
