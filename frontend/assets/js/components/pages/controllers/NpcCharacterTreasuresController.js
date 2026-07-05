import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug and character id from the NPC character treasures hash route.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Route params with game_slug and character_id.
 */
export function getNpcCharacterTreasuresParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/npcs/:character_id/treasures', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for the NPC character treasures index page.
 */
export default class NpcCharacterTreasuresController extends BasePageController {
  /**
   * Create an NPC character treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setTreasures, setPagination, setLoading, setError, client = null) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
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
      const { game_slug: gameSlug, character_id: characterId } =
        getNpcCharacterTreasuresParamsFromHash(this.client.currentHash());

      if (!gameSlug || !characterId) {
        safeSet(this.setError, 'Unable to load treasures.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchTreasures(gameSlug, characterId, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchTreasures(gameSlug, characterId, safeSet) {
    this.client.fetchIndex(`/games/${gameSlug}/npcs/${characterId}/treasures.json`)
      .then(({ data, pagination }) => {
        safeSet(this.setTreasures, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
