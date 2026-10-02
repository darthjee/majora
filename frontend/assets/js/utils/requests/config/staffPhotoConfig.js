/**
 * GET/mutation resource configuration for `staffPhoto` (issue #1473), the staff-only photo
 * management endpoints.
 *
 * @description Every endpoint here is staff/superuser-only, gated client-side by
 *   `AccessStore.ensureStaffOrSuperUser()` and enforced server-side too. None has a separate
 *   restricted/full variant, so every `regular`/`private` pair points at the same object
 *   (mirroring `staffUserConfig.js`).
 *
 *   `GET.index` (`/staff/photos.json`) returns `{max_dimension, types}`; `GET.collection`
 *   (`/staff/photos/:photoType.json`) lists the photos of one type (the type travels in the
 *   path, never as a query param); `DELETE.single` (`/staff/photos/:photoType/:id.json`)
 *   deletes a single photo.
 */
const index = { path: () => '/staff/photos.json', permission: null };
const collection = { path: ({ photoType }) => `/staff/photos/${photoType}.json`, permission: null };
const single = { path: ({ photoType, id }) => `/staff/photos/${photoType}/${id}.json`, permission: null };

export default {
  GET: {
    index: { regular: index, private: index },
    collection: { regular: collection, private: collection },
  },
  DELETE: {
    single: { regular: single, private: single },
  },
};
