import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller resolving whether the current viewer is a player of the game, for the Game NPCs
 * index page — threaded into the `npcs` list-type's `buildActionBarProps` via `ListPage`'s
 * `context` prop (gating each NPC card's upload button and its single player-facing
 * slain/revive button), independently of the game-level edit permission `ListPage` itself
 * already resolves internally and reports back through `onCanEditChange`. Mirrors the
 * `is_player` resolution `GameNpcsController#loadNpcs` previously ran inline alongside the NPC
 * list fetch itself.
 */
export default class GameNpcsAccessController {
  /**
   * Create a game NPCs access controller.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} [setIsPlayer] - Is-player flag setter.
   */
  constructor(gameSlug, setIsPlayer = Noop.noop) {
    this.gameSlug = gameSlug;
    this.setIsPlayer = setIsPlayer;
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

      return () => {
        mounted = false;
      };
    };
  }
}
