import BaseClient from './BaseClient.js';

/**
 * HTTP client for staff-only user management requests (list, detail,
 * update, and recovery-link generation).
 */
export default class StaffUserClient extends BaseClient {
  /**
   * Fetches the paginated list of users.
   *
   * @param {string|null} token - Authentication token, if any.
   * @param {URLSearchParams} [params] - Pagination query params.
   * @returns {Promise<Response>} fetch response from the staff users index endpoint.
   */
  fetchUsers(token, params = new URLSearchParams()) {
    const query = params.toString();
    const path = query ? `/staff/users.json?${query}` : '/staff/users.json';

    return this.request(path, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Fetches the details of a single user.
   *
   * @param {number|string} id - User id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the staff user endpoint.
   */
  fetchUser(id, token) {
    return this.request(`/staff/users/${id}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Submits a partial update for a user's name and/or email.
   *
   * @param {number|string} id - User id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the staff user endpoint.
   */
  updateUser(id, token, fields) {
    return this.request(`/staff/users/${id}.json`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(fields),
    });
  }

  /**
   * Requests a password-recovery link for a user, reusing a valid unexpired
   * and unused token or creating a new one. Never sends an email.
   *
   * @param {number|string} id - User id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the recovery-link endpoint.
   */
  fetchRecoveryLink(id, token) {
    return this.request(`/staff/users/${id}/recovery-link.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }
}
