import TreasureClient from '../../../../../client/TreasureClient.js';
import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game treasure creation page.
 */
export default class GameTreasureNewController extends BasePageController {
  /**
   * Extract game slug from a game treasure creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromTreasureNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/treasures/new', 'game_slug', hash);
  }

  /**
   * Create a game treasure new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   * @param {Function} [setGameType] - Setter for the containing game's currency type,
   *   used so the value-editing modal renders the right denominations. Optional — a
   *   caller that does not need this display concern may omit it.
   * @param {GameClient|null} [gameClient] - Game client override.
   */
  constructor(
    setError, setFieldErrors = Noop.noop, treasureClient = null, setGameType = Noop.noop, gameClient = null,
  ) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.treasureClient = treasureClient ?? new TreasureClient();
    this.setGameType = setGameType;
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may
   *   edit the game and redirects to the treasures index when they cannot, and
   *   fetches the containing game's currency type for the value-editing modal.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = getCurrentHash();
      const gameSlug = GameTreasureNewController.getGameSlugFromTreasureNewHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#redirectIfNotAllowed(permissions, gameSlug))
        .catch(() => this.#redirectToTreasures(gameSlug));

      this.fetchGameType(gameSlug, AuthStorage.getToken()).then((gameType) => this.setGameType(gameType));
    };
  }

  /**
   * Fetch the containing game's currency type. Degrades to `'dnd'` when the
   * game fetch fails or the response is not ok, rather than blocking the
   * form.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<string>} Resolves to the game's `game_type`.
   */
  fetchGameType(gameSlug, token) {
    return this.gameClient.fetchGame(gameSlug, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((game) => game?.game_type ?? 'dnd')
      .catch(() => 'dnd');
  }

  /**
   * Submit the new treasure form.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a POST request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, value: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.treasureClient.createGameTreasure(gameSlug, token, {
        name: formValues.name,
        value: parseInt(formValues.value, 10),
      });

      await this.#handleResponse(response, gameSlug, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #redirectIfNotAllowed(permissions, gameSlug) {
    if (!permissions.can_edit) {
      this.#redirectToTreasures(gameSlug);
    }
  }

  #redirectToTreasures(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/treasures`;
    }
  }

  async #handleResponse(response, gameSlug, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/treasures/${data.id}`;
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
