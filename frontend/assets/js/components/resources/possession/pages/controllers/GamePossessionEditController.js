import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game possession edit page (issue #1074), mirroring `GameItemEditController`.
 *
 * @description Loads the possession through `RequestStore.ensure({resource: 'possession',
 *   quantityType: 'single', params: {gameSlug, id}})`, resolving the requester's game-level edit
 *   permission (via `RequestPermissionResolvers`) to pick between the elevated, hidden-inclusive
 *   `.../possessions/:id/full.json` and the player-facing `.../possessions/:id.json`, and submits
 *   partial updates (`name`/`description`/`hidden`) through `PATCH .../possessions/:id.json`,
 *   following the same redirect-on-success/field-errors-on-400/generic-error-otherwise response
 *   handling as `GameItemEditController#submitForm`.
 */
export default class GamePossessionEditController extends BasePageController {
  /**
   * Extract the game slug and possession id from a game possession edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/possessions/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game possession edit controller.
   *
   * @param {Function} setPossession - Possession setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(setPossession, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super();
    this.setPossession = setPossession;
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
      const params = GamePossessionEditController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load possession.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadPossession(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded possession's fields to the edit form's state.
   *
   * @param {object|null} possession - Loaded possession, or null while still loading.
   * @param {{setName: Function, setDescription: Function, setHidden: Function}} setters - Form
   *   field setters.
   * @returns {void}
   */
  applyLoadedItem(possession, setters) {
    if (!possession) {
      return;
    }

    setters.setName(possession.name);
    setters.setDescription(possession.description ?? '');
    setters.setHidden(Boolean(possession.hidden));
  }

  /**
   * Submit a partial update for the possession.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (so the possession's cached `GET` data
   *   is purged on success), then redirects to the possession's detail page on success, sets
   *   field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} possessionId - Possession id.
   * @param {{name: string, description: string, hidden: boolean}} formValues - Raw form field
   *   values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, possessionId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'GamePossessionEditController',
        resource: 'possession',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: possessionId },
        body: {
          name: formValues.name,
          description: formValues.description,
          hidden: formValues.hidden,
        },
      });

      await this.#handleResponse(response, gameSlug, possessionId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #loadPossession(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GamePossessionEditController',
      resource: 'possession',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setPossession, data))
      .catch(() => safeSet(this.setError, 'Unable to load possession.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, possessionId, setters) {
    if (response.ok) {
      this.redirectTo(`/games/${gameSlug}/possessions/${possessionId}`);
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
