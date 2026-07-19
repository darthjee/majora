import StaffUserClient from '../../../../../client/StaffUserClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import parsePositiveInt from '../../../../../utils/parsePositiveInt.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the staff users index page.
 */
export default class StaffUsersController extends BasePageController {
  /**
   * Create a staff users controller.
   *
   * @param {Function} setUsers - Users setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {StaffUserClient|null} [client] - Client override.
   */
  constructor(
    setUsers,
    setPagination,
    setLoading,
    setError,
    client = null,
  ) {
    super();
    this.setUsers = setUsers;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new StaffUserClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page before
   *   fetching the users index.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!mounted) {
          return;
        }

        if (!isStaffOrSuperUser) {
          if (typeof window !== 'undefined') {
            window.location.hash = '/';
          }
          return;
        }

        this.#fetchUsers(safeSet);
      });

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Generates or reuses a recovery link for a user, storing the result in
   * the per-row recovery links map.
   *
   * @param {number|string} userId - User id.
   * @param {object} recoveryLinks - Current recovery links map, keyed by user id.
   * @param {Function} setRecoveryLinks - Recovery links map setter.
   * @returns {Promise<void>} Resolves when the request finishes.
   */
  async handleGenerateRecoveryLink(userId, recoveryLinks, setRecoveryLinks) {
    setRecoveryLinks({ ...recoveryLinks, [userId]: { status: 'loading', url: null } });

    const token = AuthStorage.getToken();

    try {
      const response = await this.client.fetchRecoveryLink(userId, token);

      if (!response.ok) {
        setRecoveryLinks({ ...recoveryLinks, [userId]: { status: 'error', url: null } });
        return;
      }

      const data = await response.json();
      setRecoveryLinks({ ...recoveryLinks, [userId]: { status: 'ready', url: data.url } });
    } catch {
      setRecoveryLinks({ ...recoveryLinks, [userId]: { status: 'error', url: null } });
    }
  }

  /**
   * Copies a previously generated recovery link URL to the clipboard.
   *
   * @param {number|string} userId - User id.
   * @param {string} url - Recovery link URL to copy.
   * @param {object} recoveryLinks - Current recovery links map, keyed by user id.
   * @param {Function} setRecoveryLinks - Recovery links map setter.
   * @returns {Promise<void>} Resolves when the copy attempt finishes.
   */
  async handleCopyRecoveryLink(userId, url, recoveryLinks, setRecoveryLinks) {
    try {
      await navigator.clipboard.writeText(url);
      setRecoveryLinks({ ...recoveryLinks, [userId]: { status: 'copied', url } });
    } catch {
      // Ignore clipboard failures; the URL remains visible for manual copying.
    }
  }

  #fetchUsers(safeSet) {
    const token = AuthStorage.getToken();
    const params = new HashRouteResolver().getPaginationParams();

    this.client.fetchUsers(token, params)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Request failed');
        }

        return response.json().then((data) => ({ data, headers: response.headers }));
      })
      .then(({ data, headers }) => {
        safeSet(this.setUsers, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, {
          page: parsePositiveInt(headers.get('page'), 1),
          pages: parsePositiveInt(headers.get('pages'), 1),
          perPage: parsePositiveInt(headers.get('per_page'), 10),
        });
      })
      .catch(() => safeSet(this.setError, 'Unable to load users.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
