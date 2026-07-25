import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for game detail page.
 */
export default class GameController extends BasePageController {
  /**
   * Extract game slug from hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug', 'game_slug', hash);
  }

  /**
   * Create a game controller.
   *
   * @param {Function} setGame - Game setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(
    setGame,
    setLoading,
    setError,
    client = null,
  ) {
    super();
    this.setGame = setGame;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
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
      const gameSlug = GameController.getGameSlugFromHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load game.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchGame(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchGame(gameSlug, safeSet) {
    RequestStore.ensure({
      componentName: 'GameController', resource: 'game', quantityType: 'single', params: { gameSlug },
    })
      .then(({ data }) => this.#renderGame(gameSlug, data, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load game.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Render the game right away using AccessStore's synchronous, fail-closed
   * access/permissions readers, then re-render once the real values resolve
   * in the background so the page picks them up without blocking the first
   * render on the access/permissions fetches.
   *
   * @param {string} gameSlug - Game slug.
   * @param {object} game - Base game data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  #renderGame(gameSlug, game, safeSet) {
    safeSet(this.setGame, this.#mergeAccess(gameSlug, game));

    Promise.all([
      AccessStore.ensureGameAccess(gameSlug),
      AccessStore.ensureGamePermissions(gameSlug),
    ]).then(() => safeSet(this.setGame, this.#mergeAccess(gameSlug, game)));
  }

  #mergeAccess(gameSlug, game) {
    return {
      ...game,
      ...AccessStore.getGameAccess(gameSlug),
      ...AccessStore.getGamePermissions(gameSlug),
    };
  }
}
