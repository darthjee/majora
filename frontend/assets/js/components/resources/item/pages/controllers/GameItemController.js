import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game item detail page (issue #724).
 *
 * @description Mirrors `GameController`'s single-object `client.fetch(path)` usage, gated on
 *   the requester's game-level edit permission (the same source `fetchGameItems` in
 *   `listTypeConfig.js` uses) to pick between the full, hidden-inclusive `items/:id/all.json`
 *   and the player-facing `items/:id.json`, fail-closed on a rejected permissions check
 *   (matching `fetchPermissionGatedIndex`'s `.catch(() => false)`).
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
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setItem, setLoading, setError, client = new GenericClient()) {
    super();
    this.setItem = setItem;
    this.setLoading = setLoading;
    this.setError = setError;
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
    return AccessStore.ensureGamePermissions(params.game_slug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false)
      .then((canEdit) => this.#fetchItem(params, canEdit, safeSet));
  }

  #fetchItem(params, canEdit, safeSet) {
    const base = `/games/${params.game_slug}/items/${params.id}`;
    const path = canEdit ? `${base}/all.json` : `${base}.json`;

    return this.client.fetch(path)
      .then((item) => safeSet(this.setItem, item))
      .catch(() => safeSet(this.setError, 'Unable to load item.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
