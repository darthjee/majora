import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import { MAX_PREVIEW_DOCUMENT_PHOTOS } from '../../../../../../common/cards/characterPreviewConstants.js';

/**
 * Manages the CharacterDocumentPhotosPreview element's own fetch of a PC/NPC `CharacterDocument`'s
 * underlying `GameDocument` photo shortlist (issue #897), through {@link RequestStore.ensure}
 * (`characterDocumentPhoto.collection`), mirroring `DocumentPhotosPreviewController` exactly, one
 * extra `characterId`/`kind` param pair for the character scope.
 */
export default class CharacterDocumentPhotosPreviewController {
  /**
   * Creates a new CharacterDocumentPhotosPreviewController instance.
   *
   * @param {Function} setPhotos - State setter for the fetched preview photos.
   * @param {Function} setLoading - State setter for the loading flag.
   */
  constructor(setPhotos, setLoading) {
    this.setPhotos = setPhotos;
    this.setLoading = setLoading;
  }

  /**
   * Build the element's mount effect, fetching the character document's photo shortlist,
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
        componentName: 'CharacterDocumentPhotosPreviewController',
        resource: 'characterDocumentPhoto',
        quantityType: 'collection',
        params: {
          gameSlug, kind, characterId, documentId,
        },
        query: { per_page: MAX_PREVIEW_DOCUMENT_PHOTOS },
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

    this.setPhotos(Array.isArray(data) ? data : []);
  }
}
