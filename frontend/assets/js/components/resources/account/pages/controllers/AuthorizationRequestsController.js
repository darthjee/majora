import AuthClient from '../../../../../client/AuthClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import parsePositiveInt from '../../../../../utils/parsePositiveInt.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the "Authorization requests" account page: lists the
 * authenticated user's own device-authorization requests, newest first, and
 * denies/authorizes a single request via the two confirm modals.
 *
 * @description Deliberately bypasses `RequestStore`/`resourceConfig.js` (the
 *   issue explicitly scopes these requests out of that store, which is
 *   dedicated to `RequestStore` "resources") in favor of calling `AuthClient`
 *   directly, mirroring `MyAccountController`'s shape.
 */
export default class AuthorizationRequestsController extends BasePageController {
  /**
   * Create an authorization requests controller.
   *
   * @param {Function} setRequests - Requests list setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {AuthClient|null} [client] - Client override.
   */
  constructor(setRequests, setPagination, setLoading, client = null) {
    super();
    this.setRequests = setRequests;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.client = client ?? new AuthClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects to the home page on any fetch failure (e.g. a
   *   `401`/`403` for a visitor who isn't logged in), mirroring `MyAccountController`.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.#fetchRequests(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Re-fetches the current page of requests unconditionally, used to refresh
   * the list after a successful deny/authorize action.
   *
   * @returns {Promise<void>} Resolves when the refresh finishes.
   */
  refresh() {
    return this.#fetchRequests((setter, value) => setter(value));
  }

  /**
   * Denies the given authorization request and refreshes the list on success.
   *
   * @param {string} uuid - Authorization request uuid to deny.
   * @returns {Promise<{ok: boolean}>} Resolves with `{ok}`, letting the caller decide
   *   whether to close the confirm modal.
   */
  async handleDeny(uuid) {
    try {
      const response = await this.client.denyAuthorizationRequest(AuthStorage.getToken(), uuid);

      if (response.ok) {
        await this.refresh();
      }

      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  }

  /**
   * Authorizes the given authorization request with the approving user's own
   * password, and refreshes the list on success.
   *
   * @param {string} uuid - Authorization request uuid to authorize.
   * @param {string} password - Approving user's own current password.
   * @returns {Promise<{ok: boolean}>} Resolves with `{ok}`, letting the caller decide
   *   whether to close the confirm modal or show an invalid-password error.
   */
  async handleAuthorize(uuid, password) {
    try {
      const response = await this.client.authorizeAuthorizationRequest(
        AuthStorage.getToken(), uuid, password,
      );

      if (response.ok) {
        await this.refresh();
      }

      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  }

  #fetchRequests(safeSet) {
    const token = AuthStorage.getToken();
    const params = new HashRouteResolver().getPaginationParams();

    return this.client.listAuthorizationRequests(token, {
      page: params.get('page'),
      perPage: params.get('per_page'),
    })
      .then((response) => this.#handleResponse(response, safeSet))
      .catch(() => this.redirectTo('/'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, safeSet) {
    if (!response.ok) {
      this.redirectTo('/');
      return;
    }

    const data = await response.json();

    safeSet(this.setRequests, Array.isArray(data) ? data : []);
    safeSet(this.setPagination, {
      page: parsePositiveInt(response.headers.get('page'), 1),
      pages: parsePositiveInt(response.headers.get('pages'), 1),
      perPage: parsePositiveInt(response.headers.get('per_page'), 10),
    });
  }
}
