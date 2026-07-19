import GenericClient from '../../../../../client/GenericClient.js';
import PlayerClient from '../../../../../client/PlayerClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the player detail page (issue #695).
 *
 * @description Simpler than {@link CharacterController}: a single player has no PC/NPC kind
 *   parameter and no treasures/items/photos fan-out, just the base `player.character`/
 *   `player.user` shape reused from the roster's `PlayerListSerializer`.
 */
export default class PlayerController extends BasePageController {
  /**
   * Extract game slug and player id from a player detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Player route params (`game_slug`, `id`).
   */
  static getPlayerParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/players/:id', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a player controller.
   *
   * @param {Function} setPlayer - Player setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} [client] - Client override, used for hash resolution.
   * @param {Function} [paramsFromHash] - Hash param extractor override, mainly for tests.
   * @param {PlayerClient|null} [playerClient] - Player client override.
   */
  constructor(
    setPlayer,
    setLoading,
    setError,
    client = null,
    paramsFromHash = PlayerController.getPlayerParamsFromHash,
    playerClient = null,
  ) {
    super();
    this.setPlayer = setPlayer;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.paramsFromHash = paramsFromHash;
    this.playerClient = playerClient ?? new PlayerClient();
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
      const params = this.paramsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load player.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadPlayer(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadPlayer(params, safeSet) {
    const token = AuthStorage.getToken();

    return this.playerClient.fetchPlayer(params.game_slug, params.id, token)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load player.');
        return response.json();
      })
      .then((player) => safeSet(this.setPlayer, player))
      .catch(() => safeSet(this.setError, 'Unable to load player.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
