import BaseClient from './BaseClient.js';

/**
 * HTTP client for staff-only user management requests.
 *
 * @description The list index, update, and recovery-link mutations moved to
 *   `RequestStore.ensure()`/`RequestStore.mutate()` (issue #842) — this client now only holds
 *   `fetchUser`, still used directly by `StaffUserController.js`'s user detail page (out of
 *   scope for that issue).
 */
export default class StaffUserClient extends BaseClient {
  /**
   * Fetches the details of a single user.
   *
   * @param {number|string} id - User id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the staff user endpoint.
   */
  fetchUser(id, token) {
    return this.getJson(`/staff/users/${id}.json`, token);
  }
}
