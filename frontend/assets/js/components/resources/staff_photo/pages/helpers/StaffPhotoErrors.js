const PREFIX = 'staff_photos_page';

const ERROR_KEYS = {
  replace: { 409: 'error_replace_in_progress', 422: 'error_path_missing' },
  delete: { 422: 'error_delete_replace_in_progress' },
};

/**
 * Maps a failed staff photo action to its error i18n key.
 *
 * @description `replace` 409 → replace in progress, `replace` 422 → path missing, `delete` 422
 *   → delete blocked by a replace in progress, 404 (either action) → not found; anything else →
 *   generic error.
 * @param {string} action - The action that failed (`'replace'` or `'delete'`).
 * @param {number|undefined} status - The HTTP status of the failed response.
 * @returns {string} The full i18n key of the error message.
 */
export default function staffPhotoErrorKey(action, status) {
  if (status === 404) return `${PREFIX}.error_not_found`;

  const key = ERROR_KEYS[action]?.[status] ?? 'error_generic';

  return `${PREFIX}.${key}`;
}
