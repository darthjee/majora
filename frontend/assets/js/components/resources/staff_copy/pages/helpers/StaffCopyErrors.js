const PREFIX = 'staff_copies_page.entity_error';

const ERROR_KEYS = { 400: 'bad_request', 404: 'not_found', 422: 'name_taken' };

/**
 * Maps a failed staff copy request to its error i18n key (issue #1571).
 *
 * @description `404` → source no longer exists, `422` → name already used in the target game,
 *   `400` → invalid request; any other status (or a network error, `undefined`) → unknown.
 * @param {number|undefined} status - The HTTP status of the failed response.
 * @returns {string} The full `staff_copies_page.entity_error.*` i18n key.
 */
export default function staffCopyErrorKey(status) {
  return `${PREFIX}.${ERROR_KEYS[status] ?? 'unknown'}`;
}
