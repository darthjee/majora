import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game common item edit page (issue #826), mirroring
 * `GamePossessionEditController`.
 *
 * @description Loads the common item through `RequestStore.ensure({resource: 'commonItem',
 *   quantityType: 'single', params: {gameSlug, id}})`, resolving the requester's game-level edit
 *   permission (via `RequestPermissionResolvers`) to pick between the elevated, hidden-inclusive
 *   `.../common_items/:id/full.json` and the player-facing `.../common_items/:id.json`, and
 *   submits partial updates (`name`/`description`/`price`/`category`/`hidden`) through `PATCH
 *   .../common_items/:id.json`, following the same redirect-on-success/field-errors-on-400/
 *   generic-error-otherwise response handling as `GamePossessionEditController#submitForm`.
 */
export default class GameCommonItemEditController extends BasePageController {
  /**
   * Extract the game slug and common item id from a game common item edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/common_items/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game common item edit controller.
   *
   * @param {Function} setCommonItem - Common item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(setCommonItem, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super();
    this.setCommonItem = setCommonItem;
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
      const params = GameCommonItemEditController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load common item.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadCommonItem(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded common item's fields to the edit form's state.
   *
   * @param {object|null} commonItem - Loaded common item, or null while still loading.
   * @param {{setName: Function, setDescription: Function, setPrice: Function,
   *   setCategory: Function, setHidden: Function}} setters - Form field setters.
   * @returns {void}
   */
  applyLoadedItem(commonItem, setters) {
    if (!commonItem) {
      return;
    }

    setters.setName(commonItem.name);
    setters.setDescription(commonItem.description ?? '');
    setters.setPrice(commonItem.price !== null && commonItem.price !== undefined ? String(commonItem.price) : '');
    setters.setCategory(commonItem.category ?? 'other');
    setters.setHidden(Boolean(commonItem.hidden));
  }

  /**
   * Submit a partial update for the common item.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (so the common item's cached `GET` data
   *   is purged on success), then redirects to the common item's detail page on success, sets
   *   field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} commonItemId - Common item id.
   * @param {{name: string, description: string, price: string|number, category: string,
   *   hidden: boolean}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, commonItemId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'GameCommonItemEditController',
        resource: 'commonItem',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: commonItemId },
        body: {
          name: formValues.name,
          description: formValues.description,
          price: Number(formValues.price) || 0,
          category: formValues.category,
          hidden: formValues.hidden,
        },
      });

      await this.#handleResponse(response, gameSlug, commonItemId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #loadCommonItem(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameCommonItemEditController',
      resource: 'commonItem',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setCommonItem, data))
      .catch(() => safeSet(this.setError, 'Unable to load common item.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, commonItemId, setters) {
    if (response.ok) {
      this.redirectTo(`/games/${gameSlug}/common_items/${commonItemId}`);
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
