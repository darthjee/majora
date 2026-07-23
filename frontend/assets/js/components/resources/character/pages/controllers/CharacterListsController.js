import CharacterClient from '../../../../../client/CharacterClient.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import { MAX_PREVIEW_ITEMS } from '../../../../common/cards/characterPreviewConstants.js';
import CharacterListMerger from './CharacterListMerger.js';

/**
 * Base controller for a character's preview lists (treasures, items, documents, photos), split out of
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
   * degrading to an empty array on failure rather than failing the whole page load. Goes
   * through `RequestStore` (`treasure.collection`) so editors see hidden treasures in this
   * preview too, matching the standalone treasures list page.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @returns {Promise<object>} Resolves to the character with treasures applied.
   */
  fetchAndMergeTreasures(character, params) {
    return CharacterListMerger.mergeResource(
      character, 'treasures',
      RequestStore.ensure({
        componentName: 'CharacterController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id },
        query: { per_page: MAX_PREVIEW_ITEMS },
      }),
    );
  }

  /**
   * Fetch the character's items and merge them onto the character as `character.items`,
   * degrading to an empty array on failure rather than failing the whole page load. Goes
   * through `RequestStore` (`item.collection`) so editors see hidden items in this preview
   * too, matching the standalone items list page.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @returns {Promise<object>} Resolves to the character with items applied.
   */
  fetchAndMergeItems(character, params) {
    return CharacterListMerger.mergeResource(
      character, 'items',
      RequestStore.ensure({
        componentName: 'CharacterController',
        resource: 'item',
        quantityType: 'collection',
        params: { gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id },
        query: { per_page: MAX_PREVIEW_ITEMS },
      }),
    );
  }

  /**
   * Fetch the character's documents and merge them onto the character as `character.documents`,
   * degrading to an empty array on failure rather than failing the whole page load. Goes
   * through `RequestStore` (`document.collection`) so editors see hidden documents in this
   * preview too, matching the standalone documents list page.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @returns {Promise<object>} Resolves to the character with documents applied.
   */
  fetchAndMergeDocuments(character, params) {
    return CharacterListMerger.mergeResource(
      character, 'documents',
      RequestStore.ensure({
        componentName: 'CharacterController',
        resource: 'document',
        quantityType: 'collection',
        params: { gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id },
        query: { per_page: MAX_PREVIEW_ITEMS },
      }),
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
