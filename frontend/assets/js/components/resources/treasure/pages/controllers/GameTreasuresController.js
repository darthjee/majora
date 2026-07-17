import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

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
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setCanEdit = Noop.noop,
  ) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setCanEdit = setCanEdit;
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

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load treasures.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadTreasures(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Resolve the requester's edit permission for the game, then fetch the matching
   * treasures list: the full catalog (including hidden treasures) through
   * `treasures/all.json` for an editor, or the player-facing, hidden-filtered
   * `treasures.json` otherwise.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} safeSet - Setter wrapper guarding against a stale/unmounted update.
   * @returns {void}
   */
  #loadTreasures(gameSlug, safeSet) {
    AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => {
        const canEdit = Boolean(permissions.can_edit);
        safeSet(this.setCanEdit, canEdit);
        return this.#fetchTreasures(gameSlug, canEdit, safeSet);
      })
      .catch(() => {
        safeSet(this.setCanEdit, false);
        return this.#fetchTreasures(gameSlug, false, safeSet);
      });
  }

  #fetchTreasures(gameSlug, canEdit, safeSet) {
    const path = canEdit ? `/games/${gameSlug}/treasures/all.json` : `/games/${gameSlug}/treasures.json`;

    return this.client.fetchIndex(path)
      .then(({ data, pagination }) => {
        safeSet(this.setTreasures, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
