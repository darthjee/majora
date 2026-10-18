/**
 * Build the regular (everyone-readable) character photo listing path, shared by both kinds.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const photosPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/photos.json`;

/**
 * Build the restricted photo listing path: `photos/all.json` for an NPC (served even when the
 * NPC is hidden), falling back to the regular path for a PC, which has no restricted variant.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const photosAllPath = (params) => (
  params.kind === 'npcs' ? `/games/${params.gameSlug}/npcs/${params.id}/photos/all.json` : photosPath(params)
);

/**
 * GET resource configuration for `characterPhoto` (issue #1616): a PC's or NPC's own photo
 * gallery, used by the character photos page and the character detail page's photo preview.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'`/`'npcs'`), `id` (character id).
 *   The plain `photos.json` 404s on a hidden NPC for every caller, editors included, so an NPC
 *   editor (character-level `can_edit`, `CharacterEditPermission` on the backend) reads
 *   `npcs/:id/photos/all.json` instead (same paginated `{id, path}` shape, `X-Skip-Cache`).
 *   PCs have no `hidden` state and no restricted sibling, so for `kind === 'pcs'` the `private`
 *   variant resolves to the exact same path, with a `null` permission.
 */
export default {
  GET: {
    collection: {
      regular: { path: photosPath, permission: null },
      private: {
        path: photosAllPath,
        permission: (params) => (params.kind === 'npcs' ? 'can_edit' : null),
        skipCache: true,
      },
    },
  },
};
