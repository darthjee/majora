import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import Noop from '../../../utils/Noop.js';

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
   * @param {Function} [setCharacter] - Character context setter, used for the "Add treasure"
   *   button's visibility and the exchange modal's affordability checks.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setCharacter = Noop.noop,
    characterClient = null,
  ) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setCharacter = setCharacter;
    this.characterClient = characterClient ?? new CharacterClient();
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
        this.#fetchCharacter(gameSlug, characterId, safeSet);
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

  #fetchCharacter(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();

    this.characterClient.fetchNpc(gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((character) => this.#mergeAccess(character, gameSlug, characterId, token, safeSet))
      .catch(() => safeSet(this.setCharacter, null));
  }

  #mergeAccess(character, gameSlug, characterId, token, safeSet) {
    if (!character) {
      safeSet(this.setCharacter, null);
      return Promise.resolve();
    }

    return this.characterClient.fetchNpcAccess(gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : { can_edit: false }))
      .then((access) => safeSet(this.setCharacter, { ...character, can_edit: Boolean(access.can_edit) }))
      .catch(() => safeSet(this.setCharacter, character));
  }
}
