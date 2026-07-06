import GameClient from '../../../client/GameClient.js';
import TreasureClient from '../../../client/TreasureClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for the game treasure edit page.
 */
export default class GameTreasureEditController extends BasePageController {
  /**
   * Extract game slug and treasure id from a game treasure edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, treasure_id: string}} Route params.
   */
  static getGameTreasureEditParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/treasures/:treasure_id/edit', hash, ['game_slug', 'treasure_id'],
    );
  }

  /**
   * Create a game treasure edit controller.
   *
   * @param {Function} setTreasure - Treasure setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   * @param {GameClient|null} [gameClient] - Game client override, used for the access check.
   */
  constructor(
    setTreasure, setLoading, setError, setFieldErrors = Noop.noop, treasureClient = null, gameClient = null,
  ) {
    super();
    this.setTreasure = setTreasure;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.treasureClient = treasureClient ?? new TreasureClient();
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects to the game treasures index when the current user
   *   may not edit the game, before fetching the treasure.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const { game_slug: gameSlug, treasure_id: treasureId } =
        GameTreasureEditController.getGameTreasureEditParamsFromHash(hash);
      const token = AuthStorage.getToken();

      this.gameClient.fetchGameAccess(gameSlug, token)
        .then((response) => (response.ok ? response.json() : { can_edit: false }))
        .then((access) => this.#handleAccess(access, gameSlug, treasureId, safeSet))
        .catch(() => this.#redirectToTreasures(gameSlug));

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Submit a partial update for the treasure.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} id - Treasure id.
   * @param {{name: string, value: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, id, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.treasureClient.updateGameTreasure(gameSlug, id, token, {
        name: formValues.name,
        value: parseInt(formValues.value, 10),
      });

      await this.#handleResponse(response, gameSlug, id, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #handleAccess(access, gameSlug, treasureId, safeSet) {
    if (!access.can_edit) {
      this.#redirectToTreasures(gameSlug);
      return;
    }

    if (!treasureId) {
      safeSet(this.setError, 'Unable to load treasure.');
      safeSet(this.setLoading, false);
      return;
    }

    this.#fetchTreasure(gameSlug, treasureId, safeSet);
  }

  #redirectToTreasures(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/treasures`;
    }
  }

  #fetchTreasure(gameSlug, treasureId, safeSet) {
    const token = AuthStorage.getToken();

    this.treasureClient.fetchGameTreasure(gameSlug, treasureId, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('treasure failed'))))
      .then((treasure) => safeSet(this.setTreasure, treasure))
      .catch(() => safeSet(this.setError, 'Unable to load treasure.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, id, setters) {
    if (response.ok) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/treasures/${id}`;
      }
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
