import GenericClient from '../../../../../client/GenericClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game item edit page (issue #766).
 *
 * @description Loads the item through the DM/admin-only `.../items/:id/full.json` endpoint
 *   (mirroring `GameItemController`'s `client.fetch(path)` usage for the show page — the backend
 *   itself gates this route to dm/admin, so no separate client-side permission check is needed),
 *   and submits partial updates (`name`/`description`/`hidden`) through
 *   `PATCH .../items/:id.json`, following the same redirect-on-success/field-errors-on-400/
 *   generic-error-otherwise response handling as `BaseCharacterEditController#handleSubmit`.
 */
export default class GameItemEditController extends BasePageController {
  /**
   * Extract the game slug and item id from a game item edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/items/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game item edit controller.
   *
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(setItem, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super();
    this.setItem = setItem;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.client = client ?? new GenericClient();
  }

  /**
   * Build the page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = GameItemEditController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load item.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadItem(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded item's fields to the edit form's state.
   *
   * @param {object|null} item - Loaded item, or null while still loading.
   * @param {{setName: Function, setDescription: Function, setHidden: Function}} setters - Form
   *   field setters.
   * @returns {void}
   */
  applyLoadedItem(item, setters) {
    if (!item) {
      return;
    }

    setters.setName(item.name);
    setters.setDescription(item.description ?? '');
    setters.setHidden(Boolean(item.hidden));
  }

  /**
   * Submit a partial update for the item.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request, then redirects to the item's detail page on success, sets field errors on
   *   400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} itemId - Item id.
   * @param {{name: string, description: string, hidden: boolean}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, itemId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();
    const path = `/games/${gameSlug}/items/${itemId}.json`;

    try {
      const response = await this.client.patchJson(path, token, {
        name: formValues.name,
        description: formValues.description,
        hidden: formValues.hidden,
      });

      await this.#handleResponse(response, gameSlug, itemId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #loadItem(params, safeSet) {
    const path = `/games/${params.game_slug}/items/${params.id}/full.json`;

    return this.client.fetch(path)
      .then((item) => safeSet(this.setItem, item))
      .catch(() => safeSet(this.setError, 'Unable to load item.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, itemId, setters) {
    if (response.ok) {
      this.redirectTo(`/games/${gameSlug}/items/${itemId}`);
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }
}
