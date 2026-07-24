import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game items index page's "Create Item" gating (issue #784).
 *
 * @description Resolves `can_create_item` via `AccessStore.ensureGamePermissions`, independent of
 *   `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the plain `can_edit`
 *   permission (dm/admin only) and would wrongly hide the "Create Item" link from staff, mirroring
 *   `GameItemController`'s own, independent `AccessStore.ensureGamePermissions`-backed
 *   `canEdit` derivation for the same reason.
 */
export default class GameItemsController extends BasePageController {
  /**
   * Extract the game slug from a game items index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromItemsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/items', 'game_slug', hash);
  }

  /**
   * Create a game items controller.
   *
   * @param {Function} setCanCreateItem - Setter for whether the requester may create a new item.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCanCreateItem, client = new GenericClient()) {
    super();
    this.setCanCreateItem = setCanCreateItem;
    this.client = client;
  }

  /**
   * Build the page mount effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const gameSlug = GameItemsController.getGameSlugFromItemsHash(this.client.currentHash());

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => Boolean(permissions.can_create_item))
        .catch(() => false)
        .then((canCreateItem) => safeSet(this.setCanCreateItem, canCreateItem));

      return () => {
        mounted = false;
      };
    };
  }
}
