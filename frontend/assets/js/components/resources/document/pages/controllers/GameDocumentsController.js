import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game documents index page's "Create Document" gating (issue #758).
 *
 * @description Resolves `can_create_document` via `AccessStore.ensureGamePermissions`,
 *   independent of `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the
 *   plain `can_edit` permission (dm/admin only) and would wrongly hide the "Create Document"
 *   link from staff, mirroring `GameItemsController`'s own, independent
 *   `AccessStore.ensureGamePermissions`-backed `canCreateItem` derivation for the same reason.
 */
export default class GameDocumentsController extends BasePageController {
  /**
   * Extract the game slug from a game documents index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromDocumentsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/documents', 'game_slug', hash);
  }

  /**
   * Create a game documents controller.
   *
   * @param {Function} setCanCreateDocument - Setter for whether the requester may create a new
   *   document.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(setCanCreateDocument, client = new GenericClient()) {
    super();
    this.setCanCreateDocument = setCanCreateDocument;
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
      const gameSlug = GameDocumentsController.getGameSlugFromDocumentsHash(
        this.client.currentHash(),
      );

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => Boolean(permissions.can_create_document))
        .catch(() => false)
        .then((canCreateDocument) => safeSet(this.setCanCreateDocument, canCreateDocument));

      return () => {
        mounted = false;
      };
    };
  }
}
