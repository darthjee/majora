import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game-scoped treasure detail page (issue #1001, `canUploadPhoto` gating
 * added in #1005).
 *
 * @description Fetches the game-scoped `Treasure` through `RequestStore.ensure({resource:
 *   'treasure', quantityType: 'single', params: {gameSlug, id}})` — unlike `GameItemController`,
 *   `treasure.single`'s `regular`/`private` variants already resolve to the exact same endpoint
 *   (see `treasureConfig.js`'s own doc comment), so there is no permission-gated fetch branch to
 *   pick. Instead mirrors `TreasureController.js`'s own optimistic-render-then-refresh pattern:
 *   the treasure is rendered right away merged with `AccessStore`'s synchronous, fail-closed
 *   `can_edit` reader, then re-rendered once `AccessStore.ensureTreasurePermissions` resolves in
 *   the background. Always calls `ensureTreasurePermissions` with `isExclusive: true` since this
 *   page's route is inherently game-scoped. Independently derives `canUploadPhoto` from
 *   `AccessStore.ensureGameAccess`, run concurrently with the treasure fetch rather than chained
 *   after it, mirroring `GameItemController`'s/`GameDocumentController`'s own
 *   `#loadCanUploadPhoto` — gates the "Give Treasure" button (issue #1005), fixing its previously
 *   -unconditional visibility.
 */
export default class GameTreasureController extends BasePageController {
  /**
   * Extract the game slug and treasure id from a game treasure detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, treasure_id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/treasures/:treasure_id', hash, ['game_slug', 'treasure_id'],
    );
  }

  /**
   * Create a game treasure controller.
   *
   * @param {Function} setTreasure - Treasure setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may give this treasure
   *   (issue #1005).
   */
  constructor(setTreasure, setLoading, setError, setCanUploadPhoto) {
    super();
    this.setTreasure = setTreasure;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanUploadPhoto = setCanUploadPhoto;
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
      const params = GameTreasureController.getParamsFromHash(getCurrentHash());

      if (!params.game_slug || !params.treasure_id) {
        safeSet(this.setError, 'Unable to load treasure.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadCanUploadPhoto(params.game_slug, safeSet);
        this.#fetchTreasureWithAccess(params.game_slug, params.treasure_id, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => GameTreasureController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  #fetchTreasureWithAccess(gameSlug, treasureId, safeSet) {
    RequestStore.ensure({
      componentName: 'GameTreasureController',
      resource: 'treasure',
      quantityType: 'single',
      params: { gameSlug, id: treasureId },
    })
      .then(({ data }) => this.#renderTreasure(treasureId, data, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load treasure.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Render the treasure right away using AccessStore's synchronous, fail-closed permissions
   * reader, then re-render once the real permissions resolve in the background so the page picks
   * them up without blocking the first render on the permissions fetch.
   *
   * @param {string|number} treasureId - Treasure id.
   * @param {object} treasure - Base treasure data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  #renderTreasure(treasureId, treasure, safeSet) {
    safeSet(this.setTreasure, this.#mergePermissions(treasureId, treasure));

    AccessStore.ensureTreasurePermissions(treasureId, true)
      .then(() => safeSet(this.setTreasure, this.#mergePermissions(treasureId, treasure)));
  }

  #mergePermissions(treasureId, treasure) {
    return { ...treasure, ...AccessStore.getTreasurePermissions(treasureId) };
  }
}
