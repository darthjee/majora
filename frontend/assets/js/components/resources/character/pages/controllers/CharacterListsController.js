import CharacterClient from '../../../../../client/CharacterClient.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import CharacterListMerger from './CharacterListMerger.js';

/**
 * Base controller for a character's preview lists (treasures, items, photos), split out of
 * `CharacterController` (which extends this class) to keep both files under the project's
 * per-file line limit. Parameterized by `characterKind` (`'pcs'` or `'npcs'`) like its subclass,
 * delegating to {@link CharacterClient}'s parameterized methods.
 */
export default class CharacterListsController extends BasePageController {
  /**
   * Create a character lists controller.
   *
   * @param {CharacterClient|null} [characterClient] - Character client override.
   * @param {string} [characterKind] - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   */
  constructor(characterClient = null, characterKind = 'pcs') {
    super();
    this.characterClient = characterClient ?? new CharacterClient();
    this.characterKind = characterKind;
  }

  /**
   * Fetch a first page of the character's treasures from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterTreasures(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacterTreasures(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Fetch a first page of the character's items from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterItems(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacterItems(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Fetch a first page of the character's photos from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterPhotos(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacterPhotos(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Fetch the character's treasures and merge them onto the character as `character.treasures`,
   * degrading to an empty array on failure rather than failing the whole page load.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<object>} Resolves to the character with treasures applied.
   */
  fetchAndMergeTreasures(character, params, token) {
    return CharacterListMerger.merge(
      character, 'treasures', this.fetchCharacterTreasures(params.game_slug, params.character_id, token),
    );
  }

  /**
   * Fetch the character's items and merge them onto the character as `character.items`,
   * degrading to an empty array on failure rather than failing the whole page load.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<object>} Resolves to the character with items applied.
   */
  fetchAndMergeItems(character, params, token) {
    return CharacterListMerger.merge(
      character, 'items', this.fetchCharacterItems(params.game_slug, params.character_id, token),
    );
  }

  /**
   * Fetch the character's photos and merge them onto the character as `character.photos`,
   * degrading to an empty array on failure rather than failing the whole page load.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<object>} Resolves to the character with photos applied.
   */
  fetchAndMergePhotos(character, params, token) {
    return CharacterListMerger.merge(
      character, 'photos', this.fetchCharacterPhotos(params.game_slug, params.character_id, token),
    );
  }
}
