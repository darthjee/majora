import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug from hash.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromHash(hash = '') {
  return Router.extractParams('/games/:game_slug', hash).game_slug ?? '';
}

/**
 * Controller for game detail page.
 */
export default class GameController extends BasePageController {
  /**
   * Create a game controller.
   *
   * @param {Function} setGame - Game setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setGame, setLoading, setError, client = null) {
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
      const gameSlug = getGameSlugFromHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load game.');
        safeSet(this.setLoading, false);
      } else {
        this.client.fetch(`/games/${gameSlug}.json`)
          .then((game) => safeSet(this.setGame, game))
          .catch(() => safeSet(this.setError, 'Unable to load game.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}
