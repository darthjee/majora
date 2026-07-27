import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller resolving whether the current viewer is a player of the game, and whether they may
 * create an NPC, for the Game NPCs index page. `isPlayer` is threaded into the `npcs` list-type's
 * `buildActionBarProps` via `ListPage`'s `context` prop (gating each NPC card's upload button and
 * its single player-facing slain/revive button), independently of the game-level edit permission
 * `ListPage` itself already resolves internally and reports back through `onCanEditChange`.
 * Mirrors the `is_player` resolution `GameNpcsController#loadNpcs` previously ran inline alongside
 * the NPC list fetch itself. `canCreateNpc` (issue #868) gates the page's own "New NPC" button,
 * resolved independently via `AccessStore.ensureGamePermissions` since it is a permission, not
 * game-access, concern.
 */
export default class GameNpcsAccessController {
  /**
   * Create a game NPCs access controller.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} [setIsPlayer] - Is-player flag setter.
   * @param {Function} [setCanCreateNpc] - Can-create-NPC flag setter.
   */
  constructor(gameSlug, setIsPlayer = Noop.noop, setCanCreateNpc = Noop.noop) {
    this.gameSlug = gameSlug;
    this.setIsPlayer = setIsPlayer;
    this.setCanCreateNpc = setCanCreateNpc;
  }

  /**
   * Build the page mount effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;

      AccessStore.ensureGameAccess(this.gameSlug)
        .then((access) => {
          if (mounted) {
            this.setIsPlayer(Boolean(access.is_player));
          }
        })
        .catch(() => {
          if (mounted) {
            this.setIsPlayer(false);
          }
        });

      AccessStore.ensureGamePermissions(this.gameSlug)
        .then((permissions) => {
          if (mounted) {
            this.setCanCreateNpc(Boolean(permissions.can_create_npc));
          }
        })
        .catch(() => {
          if (mounted) {
            this.setCanCreateNpc(false);
          }
        });

      return () => {
        mounted = false;
      };
    };
  }
}
