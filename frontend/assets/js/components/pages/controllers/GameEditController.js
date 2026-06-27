import GameClient from '../../../client/GameClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug from a game edit hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromEditHash(hash = '') {
  return Router.extractParams('/games/:game_slug/edit', hash).game_slug ?? '';
}

/**
 * Controller for the game edit page.
 */
export default class GameEditController extends BasePageController {
  /**
   * Create a game edit controller.
   *
   * @param {Function} setGame - Game setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameClient|null} [gameClient] - Game client override.
   */
  constructor(setGame, setLoading, setError, setFieldErrors = () => {}, gameClient = null) {
    super();
    this.setGame = setGame;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = getGameSlugFromEditHash(hash);

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load game.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchGameWithAccess(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Submit a partial update for the game.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, photo: string, description: string}} formValues - Raw form field values.
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
      const response = await this.gameClient.updateGame(gameSlug, token, {
        name: formValues.name,
        photo: formValues.photo,
        description: formValues.description,
      });

      await this.#handleResponse(response, gameSlug, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #fetchGameWithAccess(gameSlug, safeSet) {
    const token = AuthStorage.getToken();

    Promise.all([
      this.gameClient.fetchGame(gameSlug, token),
      this.gameClient.fetchGameAccess(gameSlug, token),
    ])
      .then(([gameResponse, accessResponse]) => Promise.all([
        gameResponse.ok
          ? gameResponse.json()
          : Promise.reject(new Error('game failed')),
        accessResponse.ok
          ? accessResponse.json()
          : Promise.resolve({ can_edit: false }),
      ]))
      .then(([game, access]) => safeSet(this.setGame, { ...game, ...access }))
      .catch(() => safeSet(this.setError, 'Unable to load game.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleResponse(response, gameSlug, setters) {
    if (response.ok) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}`;
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
