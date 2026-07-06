import GameClient from '../../../client/GameClient.js';
import GenericClient from '../../../client/GenericClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for game treasures page.
 */
export default class GameTreasuresController extends BasePageController {
  /**
   * Extract game slug from treasures hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromTreasuresHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/treasures', 'game_slug', hash);
  }

  /**
   * Create a game treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setCanEdit] - Can-edit flag setter, used to gate the "New Treasure"
   *   button and the per-treasure "Edit"/upload actions.
   * @param {GameClient|null} [gameClient] - Game client override, used for the access check.
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setCanEdit = Noop.noop,
    gameClient = null,
  ) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setCanEdit = setCanEdit;
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
      const gameSlug = GameTreasuresController.getGameSlugFromTreasuresHash(this.client.currentHash());

      this.#fetchAccess(gameSlug, safeSet);

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load treasures.');
        safeSet(this.setLoading, false);
      } else {
        this.client.fetchIndex(`/games/${gameSlug}/treasures.json`)
          .then(({ data, pagination }) => {
            safeSet(this.setTreasures, Array.isArray(data) ? data : []);
            safeSet(this.setPagination, pagination);
          })
          .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchAccess(gameSlug, safeSet) {
    const token = AuthStorage.getToken();

    this.gameClient.fetchGameAccess(gameSlug, token)
      .then((response) => (response.ok ? response.json() : { can_edit: false }))
      .then((access) => safeSet(this.setCanEdit, Boolean(access.can_edit)))
      .catch(() => safeSet(this.setCanEdit, false));
  }
}
