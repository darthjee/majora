import RequestStore from '../../../../../utils/requests/RequestStore.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

const COMPONENT_NAME = 'ApiTokensController';
const RESOURCE = 'apiToken';

/**
 * Controller for the owner "API tokens" account page (issue #1605): loads the token list and
 * the create options through `RequestStore`, and renames/revokes tokens.
 *
 * @description After every change it purges the `apiToken` resource and re-fetches the list and
 *   the options; it never patches a row in place. A 404 on rename/revoke (the token is already
 *   gone) is reported as an info notice followed by a refresh, not as a failure.
 */
export default class ApiTokensController extends BasePageController {
  /**
   * Create an API tokens controller.
   *
   * @param {{setTokens: Function, setLoading: Function, setError: Function,
   *   setOptions: Function, setOptionsError: Function, setNotice: Function}} setters - Page
   *   state setters.
   */
  constructor(setters) {
    super();
    this.setters = setters;
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects to the home page when logged out (mirroring
   *   `AuthorizationRequestsController`); otherwise loads the list and the options
   *   independently.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      if (!AuthStorage.getToken()) {
        this.redirectTo('/');
        return Noop.noop;
      }

      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.#load(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Purge the `apiToken` resource and re-fetch the list and the options. Also used as the
   * retry action and as the create modal's `onCreated`.
   *
   * @returns {Promise<void>} Resolves when both fetches finish.
   */
  refresh() {
    RequestStore.purge({ resource: RESOURCE });
    this.setters.setLoading(true);

    return this.#load((setter, value) => setter(value));
  }

  /**
   * Rename a token, sending nothing when the trimmed name is unchanged.
   *
   * @param {{id: number, name: string}} token - The token being renamed.
   * @param {string} name - The new name.
   * @returns {Promise<{ok: boolean, errors: object}>} `ok` when the row can leave edit mode;
   *   otherwise the field errors to show on the row.
   */
  async rename(token, name) {
    const trimmed = name.trim();

    if (trimmed === token.name) return { ok: true, errors: {} };

    this.setters.setNotice(null);

    try {
      const response = await this.#mutate('PATCH', token.id, { name: trimmed });

      return await this.#handleRenameResponse(response);
    } catch {
      this.setters.setNotice('action_error');
      return { ok: false, errors: {} };
    }
  }

  /**
   * Revoke a token, then refresh the list.
   *
   * @param {{id: number}} token - The token being revoked.
   * @returns {Promise<void>} Resolves when the revoke handling finishes.
   */
  async revoke(token) {
    this.setters.setNotice(null);

    try {
      const response = await this.#mutate('DELETE', token.id);

      await this.#handleChangeResponse(response);
    } catch {
      this.setters.setNotice('action_error');
    }
  }

  #mutate(method, id, body) {
    return RequestStore.mutate({
      componentName: COMPONENT_NAME, resource: RESOURCE, method, quantityType: 'single', params: { id }, body,
    });
  }

  async #handleRenameResponse(response) {
    if (response.status === 400) {
      const data = await response.json();

      return { ok: false, errors: data.errors ?? {} };
    }

    const ok = await this.#handleChangeResponse(response);

    return { ok, errors: {} };
  }

  async #handleChangeResponse(response) {
    if (response.ok) {
      await this.refresh();
      return true;
    }

    if (response.status === 404) {
      this.setters.setNotice('token_gone');
      await this.refresh();
      return true;
    }

    this.setters.setNotice('action_error');
    return false;
  }

  #load(safeSet) {
    return Promise.all([this.#loadTokens(safeSet), this.#loadOptions(safeSet)]);
  }

  #loadTokens(safeSet) {
    safeSet(this.setters.setError, false);

    return this.#ensure('collection')
      .then((data) => safeSet(this.setters.setTokens, Array.isArray(data) ? data : []))
      .catch(() => safeSet(this.setters.setError, true))
      .finally(() => safeSet(this.setters.setLoading, false));
  }

  #loadOptions(safeSet) {
    safeSet(this.setters.setOptionsError, false);

    return this.#ensure('options')
      .then((data) => safeSet(this.setters.setOptions, data))
      .catch(() => {
        safeSet(this.setters.setOptions, null);
        safeSet(this.setters.setOptionsError, true);
      });
  }

  #ensure(quantityType) {
    return RequestStore.ensure({ componentName: COMPONENT_NAME, resource: RESOURCE, quantityType })
      .then(({ data }) => data);
  }
}
