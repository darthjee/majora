import GameClient from '../../../client/GameClient.js';
import TreasureClient from '../../../client/TreasureClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import Noop from '../../../utils/Noop.js';

/**
 * Extract game slug from a game treasure creation hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromTreasureNewHash(hash = '') {
  return Router.extractParams('/games/:game_slug/treasures/new', hash).game_slug ?? '';
}

/**
 * Controller for the game treasure creation page.
 */
export default class GameTreasureNewController extends BasePageController {
  /**
   * Create a game treasure new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   * @param {GameClient|null} [gameClient] - Game client override, used for the access check.
   */
  constructor(setError, setFieldErrors = Noop.noop, treasureClient = null, gameClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.treasureClient = treasureClient ?? new TreasureClient();
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user may
   *   edit the game and redirects to the treasures index when they cannot.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = getGameSlugFromTreasureNewHash(hash);
      const token = AuthStorage.getToken();

      this.gameClient.fetchGameAccess(gameSlug, token)
        .then((response) => (response.ok ? response.json() : { can_edit: false }))
        .then((access) => this.#redirectIfNotAllowed(access, gameSlug))
        .catch(() => this.#redirectToTreasures(gameSlug));
    };
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

  #redirectIfNotAllowed(access, gameSlug) {
    if (!access.can_edit) {
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
