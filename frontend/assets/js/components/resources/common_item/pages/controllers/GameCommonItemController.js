import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game common item detail page (issue #826), mirroring
 * `GamePossessionController`.
 *
 * @description Fetches the `GameCommonItem` through `RequestStore.ensure({resource:
 *   'commonItem', quantityType: 'single', params: {gameSlug, id}})`, which internally resolves
 *   the requester's game-level edit permission (via `RequestPermissionResolvers`) to pick between
 *   the full, hidden-inclusive `common_items/:id/full.json` and the player-facing
 *   `common_items/:id.json`, fail-closed on a rejected permissions check. Independently derives
 *   `canUploadPhoto` from `AccessStore.ensureGameAccess` (a wider, "who can upload" gate that
 *   also includes `is_player`), run concurrently with the common item fetch rather than chained
 *   after it. Also independently derives `canEdit` from its own
 *   `AccessStore.ensureCommonItemPermissions` call (resource-specific, backed by
 *   `/permissions/game_common_item.json`), exposed to gate the show page's Edit button.
 */
export default class GameCommonItemController extends BasePageController {
  /**
   * Extract the game slug and common item id from a game common item detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/common_items/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game common item controller.
   *
   * @param {Function} setCommonItem - Common item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit this common item.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCommonItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.setCommonItem = setCommonItem;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanEdit = setCanEdit;
    this.setCanUploadPhoto = setCanUploadPhoto;
    this.client = client;
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
      const params = GameCommonItemController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load common item.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadCommonItem(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadCommonItem(params, safeSet) {
    this.#loadCanUploadPhoto(params.game_slug, safeSet);
    this.#loadCanEdit(params.game_slug, safeSet);

    return this.#fetchCommonItem(params, safeSet);
  }

  #loadCanEdit(gameSlug, safeSet) {
    return AccessStore.ensureCommonItemPermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => GameCommonItemController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  #fetchCommonItem(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameCommonItemController',
      resource: 'commonItem',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.id },
    })
      .then(({ data }) => safeSet(this.setCommonItem, data))
      .catch(() => safeSet(this.setError, 'Unable to load common item.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
