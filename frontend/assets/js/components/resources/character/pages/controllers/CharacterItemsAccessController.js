import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller resolving the `can_create_item` character permission for the PC/NPC items index
 * page (issue #714), independent of `ListPage`'s own `can_edit`-based `onCanEditChange` — kept
 * separate so `ListPage`'s generic edit-permission contract doesn't have to widen for this
 * single, items-page-specific flag. `can_edit` (no staff bypass) is unsuitable here since staff
 * must also see the "Create Item" button.
 */
export default class CharacterItemsAccessController extends BasePageController {
  /**
   * Extract game slug/character id from an items index hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string}} Extracted route params.
   */
  static getParamsFromItemsHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/items`, hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create an items-access controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {Function} [setCanCreateItem] - Setter for the resolved `can_create_item` flag.
   */
  constructor(characterKind, setCanCreateItem = Noop.noop) {
    super();
    this.characterKind = characterKind;
    this.setCanCreateItem = setCanCreateItem;
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback resolving the character-level `can_create_item` permission
   *   and feeding it back through `setCanCreateItem`, fail-closed on rejection.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = getCurrentHash();
      const { game_slug: gameSlug, character_id: characterId } = CharacterItemsAccessController
        .getParamsFromItemsHash(this.characterKind, hash);

      AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
        .then((permissions) => safeSet(this.setCanCreateItem, Boolean(permissions.can_create_item)))
        .catch(() => safeSet(this.setCanCreateItem, false));

      return () => {
        mounted = false;
      };
    };
  }
}
