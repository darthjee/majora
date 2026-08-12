import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game faction edit page (issue #812), mirroring
 * `GamePossessionEditController`/`GameItemEditController`.
 *
 * @description Loads the faction through `RequestStore.ensure({resource: 'faction',
 *   quantityType: 'single', params: {gameSlug, id}})`, and submits partial updates (`name`)
 *   through `PATCH .../factions/:id.json`, following the same
 *   redirect-on-success/field-errors-on-400/generic-error-otherwise response handling as
 *   `GamePossessionEditController#submitForm`. The edit route itself is DM/staff-only (per the
 *   update-permission correction documented in `docs/agents/plans/812-add-factions/plan.md`'s
 *   "Shared contracts" section) — enforced server-side by the `PATCH` endpoint's `check_game_edit`
 *   gate, mirrored client-side by `GameFactionController`'s own `canEdit` derivation gating the
 *   show page's Edit button that links here.
 */
export default class GameFactionEditController extends BasePageController {
  /**
   * Extract the game slug and faction id from a game faction edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/factions/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game faction edit controller.
   *
   * @param {Function} setFaction - Faction setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(setFaction, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super();
    this.setFaction = setFaction;
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
      const params = GameFactionEditController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load faction.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadFaction(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Apply a loaded faction's fields to the edit form's state.
   *
   * @param {object|null} faction - Loaded faction, or null while still loading.
   * @param {{setName: Function}} setters - Form field setters.
   * @returns {void}
   */
  applyLoadedItem(faction, setters) {
    if (!faction) {
      return;
    }

    setters.setName(faction.name);
  }

  /**
   * Submit a partial update for the faction.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (so the faction's cached `GET` data is
   *   purged on success), then redirects to the faction's detail page on success, sets field
   *   errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - Faction id.
   * @param {{name: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, factionId, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'GameFactionEditController',
        resource: 'faction',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: factionId },
        body: { name: formValues.name },
      });

      await this.#handleResponse(response, gameSlug, factionId, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #loadFaction(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameFactionEditController',
      resource: 'faction',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setFaction, data))
      .catch(() => safeSet(this.setError, 'Unable to load faction.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, factionId, setters) {
    if (response.ok) {
      this.redirectTo(`/games/${gameSlug}/factions/${factionId}`);
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
