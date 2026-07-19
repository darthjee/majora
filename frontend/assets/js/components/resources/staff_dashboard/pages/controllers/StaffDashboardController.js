import StaffCacheClient from '../../../../../client/StaffCacheClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the staff dashboard page.
 */
export default class StaffDashboardController extends BasePageController {
  /**
   * Create a staff dashboard controller.
   *
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {StaffCacheClient|null} [client] - Client override.
   */
  constructor(setLoading, setError, client = null) {
    super();
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new StaffCacheClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page,
   *   otherwise clears the loading state so the dashboard card renders.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AccessStore.ensureStaffOrSuperUser()
        .then((isStaffOrSuperUser) => {
          if (!mounted) {
            return;
          }

          if (!isStaffOrSuperUser) {
            this.redirectTo('/');
            return;
          }

          safeSet(this.setLoading, false);
        })
        .catch(() => safeSet(this.setError, 'Unable to load dashboard.'));

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Clears the server-side cache, tracking the button's transient status.
   *
   * @param {Function} setStatus - Status setter (`idle`, `loading`, `success`, or `error`).
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async clearCache(setStatus) {
    setStatus('loading');

    const token = AuthStorage.getToken();

    try {
      const response = await this.client.clearCache(token);

      setStatus(response.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }
}
