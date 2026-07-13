import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from '../../common/controllers/BasePageController.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import AccessStore from '../../../utils/AccessStore.js';
import Noop from '../../../utils/Noop.js';

/**
 * Base controller for character treasures index pages (PC and NPC).
 *
 * @description Holds all shared logic for NPC and PC character treasures pages.
 *   Subclasses supply the type-specific hash param extractor and `characterKind`
 *   (`'pcs'` or `'npcs'`), used both as the URL segment and to build the correct
 *   {@link CharacterClient} calls.
 */
export default class BaseCharacterTreasuresController extends BasePageController {
  /**
   * Create a base character treasures controller.
   *
   * @param {object} setters - Page state setters.
   * @param {Function} setters.setTreasures - Treasures setter.
   * @param {Function} setters.setPagination - Pagination setter.
   * @param {Function} setters.setLoading - Loading setter.
   * @param {Function} setters.setError - Error setter.
   * @param {Function} [setters.setCharacter] - Character context setter, used for the "Add treasure"
   *   button's visibility and the exchange modal's affordability checks.
   * @param {Function} getParamsFromHash - Hash param extractor returning `game_slug`/`character_id`.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {GenericClient|null} [client] - Client override.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setters,
    getParamsFromHash,
    characterKind,
    client = null,
    characterClient = null,
  ) {
    super();
    const { setTreasures, setPagination, setLoading, setError, setCharacter = Noop.noop } = setters;
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.getParamsFromHash = getParamsFromHash;
    this.characterKind = characterKind;
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
        this.getParamsFromHash(this.client.currentHash());

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
    this.client.fetchIndex(`/games/${gameSlug}/${this.characterKind}/${characterId}/treasures.json`)
      .then(({ data, pagination }) => {
        safeSet(this.setTreasures, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchCharacter(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();

    this.characterClient.fetchCharacter(this.characterKind, gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((character) => this.#mergeAccess(character, gameSlug, characterId, safeSet))
      .catch(() => safeSet(this.setCharacter, null));
  }

  #mergeAccess(character, gameSlug, characterId, safeSet) {
    if (!character) {
      safeSet(this.setCharacter, null);
      return Promise.resolve();
    }

    return AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
      .then((permissions) => safeSet(this.setCharacter, { ...character, can_edit: Boolean(permissions.can_edit) }));
  }
}
