import CharacterClient from '../../../../../client/CharacterClient.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import CharacterListMerger from './CharacterListMerger.js';

/**
 * Base controller for a character's photo preview list, split out of `CharacterController`
 * (which extends this class) to keep both files under the project's per-file line limit.
 * Parameterized by `characterKind` (`'pcs'` or `'npcs'`) like its subclass, delegating to
 * {@link CharacterClient}'s parameterized methods.
 *
 * @description The treasures/items/documents preview lists this class used to fetch and merge
 *   onto the character (`fetchAndMergeTreasures`/`fetchAndMergeItems`/`fetchAndMergeDocuments`,
 *   issue #805) are now fetched independently by the `ShortList` element itself, through
 *   `RequestStore`, driven by `shortListResourceConfig` (issue #856) — this controller no
 *   longer threads them through the character.
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
