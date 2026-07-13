import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import AccessStore from '../../../../../utils/AccessStore.js';
import BaseEditController from '../../../../common/controllers/BaseEditController.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game edit page.
 */
export default class GameEditController extends BaseEditController {
  /**
   * Extract game slug from a game edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromEditHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/edit', 'game_slug', hash);
  }

  /**
   * Create a game edit controller.
   *
   * @param {Function} setGame - Game setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameClient|null} [gameClient] - Game client override.
   */
  constructor(setGame, setLoading, setError, setFieldErrors = Noop.noop, gameClient = null) {
    super(setGame, setLoading, setError, setFieldErrors);
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Load the game and its access permissions.
   *
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  loadResource(safeSet) {
    const hash = typeof window === 'undefined' ? '' : window.location.hash;
    const gameSlug = GameEditController.getGameSlugFromEditHash(hash);

    if (!gameSlug) {
      safeSet(this.setError, 'Unable to load game.');
      safeSet(this.setLoading, false);
      return;
    }

    const token = AuthStorage.getToken();

    this.fetchWithAccess(
      this.gameClient.fetchGame(gameSlug, token),
      AccessStore.ensureGamePermissions(gameSlug),
      safeSet,
      'Unable to load game.',
    );
  }

  /**
   * Submit a partial update for the game.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, description: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, formValues, setters) {
    const token = AuthStorage.getToken();

    return this.performSubmit(
      event,
      setters,
      () => this.gameClient.updateGame(gameSlug, token, {
        name: formValues.name,
        description: formValues.description,
      }),
      `/games/${gameSlug}`,
    );
  }
}
