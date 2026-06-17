import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import { MAX_PREVIEW_CHARACTERS } from '../../elements/characterPreviewConstants.js';

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
   * @param {Function} [setPcs] - PCs preview setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setGame, setLoading, setError, setPcs = () => {}, client = null) {
    super();
    this.setGame = setGame;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setPcs = setPcs;
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

        this.#fetchPcsPreview(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Fetch the PCs preview list, resolving to an empty list on failure so
   * the secondary fetch never blocks rendering of the game page.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} safeSet - Setter wrapper that only updates while mounted.
   * @returns {void}
   */
  #fetchPcsPreview(gameSlug, safeSet) {
    this.client.fetch(`/games/${gameSlug}/pcs.json?per_page=${MAX_PREVIEW_CHARACTERS}`)
      .then((pcs) => safeSet(this.setPcs, Array.isArray(pcs) ? pcs : []))
      .catch(() => safeSet(this.setPcs, []));
  }
}
