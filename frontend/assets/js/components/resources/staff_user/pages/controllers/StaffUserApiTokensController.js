import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

const COMPONENT_NAME = 'StaffUserApiTokensController';
const RESOURCE = 'staffUser';

/**
 * Controller for the staff user detail page's API-token panel (issue #1606).
 *
 * @description Owns only the panel's own `tokens`/`loading`/`error`/`notice` state, decoupled
 *   from the page's user fetch (`StaffUserController`) so a token-fetch failure never blanks the
 *   user details above it. No `AccessStore` re-check here: `StaffUserController` already
 *   redirects non-staff/non-superusers away before the page (and this panel) mounts.
 *
 *   After a revoke it purges the `staffUser` resource and re-fetches the whole list; it never
 *   patches a row. `notice` is `null`, `'token_gone'` (a 404 on revoke, shown as info) or
 *   `'action_error'` (any other failure, shown above the still-visible table).
 */
export default class StaffUserApiTokensController extends BasePageController {
  /**
   * Create a staff user API tokens controller.
   *
   * @param {Function} setTokens - Tokens setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Load error setter.
   * @param {Function} setNotice - Revoke notice setter (`null`, `'token_gone'` or `'action_error'`).
   */
  constructor(setTokens, setLoading, setError, setNotice) {
    super();
    this.setTokens = setTokens;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setNotice = setNotice;
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

      this.#fetchTokens(userId, safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Purge the `staffUser` resource and re-fetch the token list. Leaves any notice untouched, so
   * the notice set by the revoke that triggered the refresh stays visible.
   *
   * @param {string} userId - The staff user's id.
   * @returns {Promise<void>} Resolves once the refreshed list has loaded (or failed to).
   */
  async refresh(userId) {
    RequestStore.purge({ resource: RESOURCE });

    const safeSet = this.buildSafeSetter(() => true);

    await this.#fetchTokens(userId, safeSet);
  }

  /**
   * Revoke a single API token, then refresh the list.
   *
   * @param {string} userId - The staff user's id.
   * @param {number|string} tokenId - The token's id.
   * @returns {Promise<void>} Resolves when the revoke and the refresh both finish.
   */
  async revoke(userId, tokenId) {
    this.setNotice(null);

    try {
      const response = await RequestStore.mutate({
        componentName: COMPONENT_NAME,
        resource: RESOURCE,
        method: 'DELETE',
        quantityType: 'deleteApiToken',
        params: { id: userId, tokenId },
      });

      this.#noticeFor(response);
    } catch {
      this.setNotice('action_error');
    }

    await this.refresh(userId);
  }

  #noticeFor(response) {
    if (response.ok) return;

    this.setNotice(response.status === 404 ? 'token_gone' : 'action_error');
  }

  #fetchTokens(userId, safeSet) {
    return RequestStore.ensure({
      componentName: COMPONENT_NAME,
      resource: RESOURCE,
      quantityType: 'apiTokens',
      params: { id: userId },
    })
      .then(({ data }) => safeSet(this.setTokens, Array.isArray(data) ? data : []))
      .catch(() => safeSet(this.setError, true))
      .finally(() => safeSet(this.setLoading, false));
  }
}
