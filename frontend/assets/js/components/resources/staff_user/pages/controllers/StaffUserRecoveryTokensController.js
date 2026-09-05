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
 *
 *   Issue #1249 added the row-level `unexpire`/`force-expire`/`delete` action handlers, all
 *   following the shared post-action refresh contract: {@link RequestStore.purge} the `staffUser`
 *   resource, then re-fetch the whole token list via {@link RequestStore.ensure} — no handler ever
 *   patches a single row from the mutation's own (empty) response body. `actionError` is a
 *   separate flag from the mount-load `tokensError`, so an action failure only shows a transient
 *   alert above the still-visible table rather than blanking the whole panel.
 */
export default class StaffUserRecoveryTokensController extends BasePageController {
  /**
   * Create a staff user recovery tokens controller.
   *
   * @param {Function} setTokens - Tokens setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setActionError - Row-action error setter.
   */
  constructor(setTokens, setLoading, setError, setActionError) {
    super();
    this.setTokens = setTokens;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setActionError = setActionError;
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
   * Re-fetch the token list after a mutation, per the shared post-action refresh contract (issue
   * #1249) also reused by `StaffUser.jsx`'s panel-level "Generate recovery link" handler.
   *
   * @param {string} userId - The staff user's id.
   * @returns {Promise<void>} Resolves once the refreshed list has loaded (or failed to).
   */
  async refresh(userId) {
    this.setActionError(false);
    RequestStore.purge({ resource: 'staffUser' });

    const safeSet = this.buildSafeSetter(() => true);

    await this.#fetchTokens(userId, safeSet);
  }

  /**
   * Clears a token's expiration through {@link RequestStore.mutate} (issue #1249), then refreshes
   * the token list.
   *
   * @param {string} userId - The staff user's id.
   * @param {number|string} tokenId - The token's id.
   * @returns {Promise<void>} Resolves when the action and refresh both finish.
   */
  async handleUnexpire(userId, tokenId) {
    await this.#mutateToken(userId, tokenId, 'POST', 'unexpireRecoveryToken');
  }

  /**
   * Force-expires a token through {@link RequestStore.mutate} (issue #1249), then refreshes the
   * token list.
   *
   * @param {string} userId - The staff user's id.
   * @param {number|string} tokenId - The token's id.
   * @returns {Promise<void>} Resolves when the action and refresh both finish.
   */
  async handleForceExpire(userId, tokenId) {
    await this.#mutateToken(userId, tokenId, 'POST', 'forceExpireRecoveryToken');
  }

  /**
   * Deletes a token through {@link RequestStore.mutate} (issue #1249), then refreshes the token
   * list.
   *
   * @param {string} userId - The staff user's id.
   * @param {number|string} tokenId - The token's id.
   * @returns {Promise<void>} Resolves when the action and refresh both finish.
   */
  async handleDelete(userId, tokenId) {
    await this.#mutateToken(userId, tokenId, 'DELETE', 'deleteRecoveryToken');
  }

  async #mutateToken(userId, tokenId, method, quantityType) {
    try {
      const response = await RequestStore.mutate({
        componentName: 'StaffUserRecoveryTokensController',
        resource: 'staffUser',
        method,
        quantityType,
        params: { id: userId, tokenId },
      });

      await this.refresh(userId);

      if (!response.ok) {
        this.setActionError(true);
      }
    } catch {
      await this.refresh(userId);
      this.setActionError(true);
    }
  }

  #fetchTokens(userId, safeSet) {
    return RequestStore.ensure({
      componentName: 'StaffUserRecoveryTokensController',
      resource: 'staffUser',
      quantityType: 'recoveryTokens',
      params: { id: userId },
    })
      .then(({ data }) => safeSet(this.setTokens, Array.isArray(data) ? data : []))
      .catch(() => safeSet(this.setError, true))
      .finally(() => safeSet(this.setLoading, false));
  }
}
