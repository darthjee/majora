import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller resolving the `can_create_possession` character permission for the PC/NPC
 * possessions index page (issue #1076), independent of `ListPage`'s own `can_edit`-based
 * `onCanEditChange` — kept separate so `ListPage`'s generic edit-permission contract doesn't have
 * to widen for this single, possessions-page-specific flag. `can_edit` (no staff bypass) is
 * unsuitable here since staff must also see the "Create Possession" button. Mirrors
 * `CharacterItemsAccessController` exactly.
 */
export default class CharacterPossessionsAccessController extends BasePageController {
  /**
   * Extract game slug/character id from a possessions index hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string}} Extracted route params.
   */
  static getParamsFromPossessionsHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/possessions`, hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create a possessions-access controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {Function} [setCanCreatePossession] - Setter for the resolved `can_create_possession`
   *   flag.
   */
  constructor(characterKind, setCanCreatePossession = Noop.noop) {
    super();
    this.characterKind = characterKind;
    this.setCanCreatePossession = setCanCreatePossession;
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback resolving the character-level `can_create_possession`
   *   permission and feeding it back through `setCanCreatePossession`, fail-closed on rejection.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = getCurrentHash();
      const { game_slug: gameSlug, character_id: characterId } = CharacterPossessionsAccessController
        .getParamsFromPossessionsHash(this.characterKind, hash);

      AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
        .then((permissions) => safeSet(this.setCanCreatePossession, Boolean(permissions.can_create_possession)))
        .catch(() => safeSet(this.setCanCreatePossession, false));

      return () => {
        mounted = false;
      };
    };
  }
}
