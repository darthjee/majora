import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the staff user detail page's recovery-token panel.
 *
 * @description Owns only the token panel's own `loading`/`error`/`data` state — decoupled from
 *   the page's user fetch (`StaffUserController`) so a token-fetch failure never blanks the
 *   name/email/status block above it. No `AccessStore.ensureStaffOrSuperUser()` re-check here —
 *   `StaffUser.jsx`'s own `StaffUserController` already redirects non-staff/non-superusers away
 *   before the page (and this panel) ever mounts.
 */
export default class StaffUserRecoveryTokensController extends BasePageController {
  /**
   * Create a staff user recovery tokens controller.
   *
   * @param {Function} setTokens - Tokens setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   */
  constructor(setTokens, setLoading, setError) {
    super();
    this.setTokens = setTokens;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  /**
   * Build the panel's own loading effect.
   *
   * @param {string} userId - The staff user's id.
   * @returns {Function} Effect callback.
   */
  buildEffect(userId) {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      RequestStore.ensure({
        componentName: 'StaffUserRecoveryTokensController',
        resource: 'staffUser',
        quantityType: 'recoveryTokens',
        params: { id: userId },
      })
        .then(({ data }) => safeSet(this.setTokens, Array.isArray(data) ? data : []))
        .catch(() => safeSet(this.setError, true))
        .finally(() => safeSet(this.setLoading, false));

      return () => {
        mounted = false;
      };
    };
  }
}
