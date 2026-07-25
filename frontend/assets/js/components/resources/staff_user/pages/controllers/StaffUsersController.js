import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
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
   */
  constructor(
    setUsers,
    setPagination,
    setLoading,
    setError,
  ) {
    super();
    this.setUsers = setUsers;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
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
   * Generates or reuses a recovery link for a user through {@link RequestStore.mutate} (issue
   * #842), storing the result in the per-row recovery links map.
   *
   * @param {number|string} userId - User id.
   * @param {object} recoveryLinks - Current recovery links map, keyed by user id.
   * @param {Function} setRecoveryLinks - Recovery links map setter.
   * @returns {Promise<void>} Resolves when the request finishes.
   */
  async handleGenerateRecoveryLink(userId, recoveryLinks, setRecoveryLinks) {
    setRecoveryLinks({ ...recoveryLinks, [userId]: { status: 'loading', url: null } });

    try {
      const response = await RequestStore.mutate({
        componentName: 'StaffUsersController',
        resource: 'staffUser',
        method: 'POST',
        quantityType: 'recoveryLink',
        params: { id: userId },
      });

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
    const params = new HashRouteResolver().getPaginationParams();

    RequestStore.ensure({
      componentName: 'StaffUsersController',
      resource: 'staffUser',
      quantityType: 'collection',
      query: Object.fromEntries(params),
    })
      .then(({ data, pagination }) => {
        safeSet(this.setUsers, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load users.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
