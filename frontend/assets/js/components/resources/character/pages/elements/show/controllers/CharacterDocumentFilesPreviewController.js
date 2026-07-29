import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import { MAX_PREVIEW_DOCUMENT_FILES } from '../../../../../../common/cards/characterPreviewConstants.js';

/**
 * Manages the CharacterDocumentFilesPreview element's own fetch of a PC/NPC `CharacterDocument`'s
 * underlying `GameDocument` file shortlist (issue #897), through {@link RequestStore.ensure}
 * (`characterDocumentFile.collection`), mirroring `DocumentFilesPreviewController` exactly, one
 * extra `characterId`/`kind` param pair for the character scope.
 */
export default class CharacterDocumentFilesPreviewController {
  /**
   * Creates a new CharacterDocumentFilesPreviewController instance.
   *
   * @param {Function} setFiles - State setter for the fetched preview files.
   * @param {Function} setLoading - State setter for the loading flag.
   */
  constructor(setFiles, setLoading) {
    this.setFiles = setFiles;
    this.setLoading = setLoading;
  }

  /**
   * Build the element's mount effect, fetching the character document's file shortlist,
   * degrading to an empty list on failure so a broken preview never blocks the rest of the
   * character document page. Guards against updating state after unmount.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {number|string} characterId - Character id.
   * @param {number|string} documentId - `CharacterDocument` id.
   * @returns {Function} Effect callback.
   */
  buildEffect(gameSlug, kind, characterId, documentId) {
    return () => {
      let mounted = true;

      RequestStore.ensure({
        componentName: 'CharacterDocumentFilesPreviewController',
        resource: 'characterDocumentFile',
        quantityType: 'collection',
        params: {
          gameSlug, kind, characterId, documentId,
        },
        query: { per_page: MAX_PREVIEW_DOCUMENT_FILES },
      })
        .then(({ data }) => this.#handleResponse(data, mounted))
        .catch(() => this.#handleResponse([], mounted))
        .finally(() => {
          if (mounted) {
            this.setLoading(false);
          }
        });

      return () => {
        mounted = false;
      };
    };
  }

  #handleResponse(data, mounted) {
    if (!mounted) {
      return;
    }

    this.setFiles(Array.isArray(data) ? data : []);
  }
}
