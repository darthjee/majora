import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game item detail page (issue #724, photo upload gating added in #749,
 * edit button gating added in #782).
 *
 * @description Fetches the `GameItem` through `RequestStore.ensure({resource: 'item',
 *   quantityType: 'single', params: {gameSlug, kind: 'game', id}})`, which internally resolves
 *   the requester's game-level edit permission (via `RequestPermissionResolvers`, the same
 *   `AccessStore.ensureGamePermissions` source `fetchGameItems` in `listTypeConfig.js` uses) to
 *   pick between the full, hidden-inclusive `items/:id/full.json` and the player-facing
 *   `items/:id.json`, fail-closed on a rejected permissions check. Independently derives
 *   `canUploadPhoto` from `AccessStore.ensureGameAccess` (a wider, "who can upload" gate that
 *   also includes `is_player`, unlike the narrower `can_edit` used to pick the fetch endpoint),
 *   run concurrently with the item fetch rather than chained after it. Also independently
 *   derives `canEdit` from its own `AccessStore.ensureGamePermissions` call (deduped against
 *   `RequestStore`'s own permission resolution by `AccessStore`'s cache, so this costs no extra
 *   network round trip), exposed to gate the show page's Edit button.
 */
export default class GameItemController extends BasePageController {
  /**
   * Extract the game slug and item id from a game item detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/items/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game item controller.
   *
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} setCanEdit - Setter for whether the requester may edit this item.
   * @param {Function} setCanUploadPhoto - Setter for whether the requester may upload a photo.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client = new GenericClient()) {
    super();
    this.setItem = setItem;
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
      const params = GameItemController.getParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load item.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadItem(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadItem(params, safeSet) {
    this.#loadCanUploadPhoto(params.game_slug, safeSet);
    this.#loadCanEdit(params.game_slug, safeSet);

    return this.#fetchItem(params, safeSet);
  }

  #loadCanEdit(gameSlug, safeSet) {
    return AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => safeSet(this.setCanEdit, canEdit));
  }

  #loadCanUploadPhoto(gameSlug, safeSet) {
    return AccessStore.ensureGameAccess(gameSlug)
      .then((access) => GameItemController.#canUploadPhoto(access))
      .catch(() => false)
      .then((canUploadPhoto) => safeSet(this.setCanUploadPhoto, canUploadPhoto));
  }

  static #canUploadPhoto(access) {
    return Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player);
  }

  #fetchItem(params, safeSet) {
    return RequestStore.ensure({
      resource: 'item',
      quantityType: 'single',
      params: { gameSlug: params.game_slug, kind: 'game', id: params.id },
    })
      .then(({ data }) => safeSet(this.setItem, data))
      .catch(() => safeSet(this.setError, 'Unable to load item.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
