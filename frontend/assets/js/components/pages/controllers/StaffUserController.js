import StaffUserClient from '../../../client/StaffUserClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import AccessStore from '../../../utils/AccessStore.js';
import BasePageController from './BasePageController.js';

/**
 * Controller for the staff user detail page.
 */
export default class StaffUserController extends BasePageController {
  /**
   * Extract user id from a staff user detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} User id.
   */
  static getStaffUserIdFromHash(hash = '') {
    return BasePageController.extractParam('/staff/users/:user_id', 'user_id', hash);
  }

  /**
   * Create a staff user controller.
   *
   * @param {Function} setUser - User setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {StaffUserClient|null} [client] - Client override.
   */
  constructor(setUser, setLoading, setError, client = null) {
    super();
    this.setUser = setUser;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new StaffUserClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page before
   *   fetching the user detail.
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

        const hash = typeof window === 'undefined' ? '' : window.location.hash;
        const id = StaffUserController.getStaffUserIdFromHash(hash);

        if (!id) {
          safeSet(this.setError, true);
          safeSet(this.setLoading, false);
        } else {
          this.#fetchUser(id, safeSet);
        }
      });

      return () => {
        mounted = false;
      };
    };
  }

  #fetchUser(id, safeSet) {
    const token = AuthStorage.getToken();

    this.client.fetchUser(id, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('user failed'))))
      .then((user) => safeSet(this.setUser, user))
      .catch(() => safeSet(this.setError, true))
      .finally(() => safeSet(this.setLoading, false));
  }
}
