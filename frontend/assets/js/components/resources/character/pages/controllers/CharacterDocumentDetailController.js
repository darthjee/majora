import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the PC/NPC document detail page (issue #892), shared by `PcCharacterDocument`
 * and `NpcCharacterDocument` via the `characterKind` constructor argument. Fetches the
 * `CharacterDocument` through `RequestStore.ensure({resource: 'document', quantityType: 'single',
 * params: {gameSlug, kind: characterKind, id: characterId, documentId}})`, which internally
 * resolves the requester's character-level edit permission (via `RequestPermissionResolvers`) to
 * pick between the full, hidden-inclusive `documents/:id/full.json` and the player-facing
 * `documents/:id.json`, fail-closed on a rejected permissions check — mirroring
 * `CharacterItemDetailController`, but simpler: `CharacterDocument` has no photo of its own to
 * upload and no edit page, so there is no independent `canEdit`/`canUploadPhoto` derivation here.
 */
export default class CharacterDocumentDetailController extends BasePageController {
  /**
   * Extract the game slug, character id, and document id from a character document detail hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `character_id`, `id`).
   */
  static getParamsFromHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/documents/:id`,
      hash,
      ['game_slug', 'character_id', 'id'],
    );
  }

  /**
   * Create a character document detail controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setDocument - Document setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(characterKind, setDocument, setLoading, setError, client = new GenericClient()) {
    super();
    this.characterKind = characterKind;
    this.setDocument = setDocument;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client;
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
      const params = CharacterDocumentDetailController.getParamsFromHash(
        this.characterKind, this.client.currentHash(),
      );

      if (!params.game_slug || !params.character_id || !params.id) {
        safeSet(this.setError, 'Unable to load document.');
        safeSet(this.setLoading, false);
      } else {
        this.#loadDocument(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #loadDocument(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'CharacterDocumentDetailController',
      resource: 'document',
      quantityType: 'single',
      params: {
        gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id, documentId: params.id,
      },
    })
      .then(({ data }) => safeSet(this.setDocument, data))
      .catch(() => safeSet(this.setError, 'Unable to load document.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
