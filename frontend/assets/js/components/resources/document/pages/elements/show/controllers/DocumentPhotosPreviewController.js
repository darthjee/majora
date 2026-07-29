import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import { MAX_PREVIEW_DOCUMENT_PHOTOS } from '../../../../../../common/cards/characterPreviewConstants.js';

/**
 * Manages the DocumentPhotosPreview element's own fetch of a `GameDocument`'s photo shortlist
 * (issue #873), through {@link RequestStore.ensure} (`gameDocumentPhoto.collection`), mirroring
 * `OpenPollsWidgetController`'s self-fetching widget pattern.
 */
export default class DocumentPhotosPreviewController {
  /**
   * Creates a new DocumentPhotosPreviewController instance.
   *
   * @param {Function} setPhotos - State setter for the fetched preview photos.
   * @param {Function} setLoading - State setter for the loading flag.
   */
  constructor(setPhotos, setLoading) {
    this.setPhotos = setPhotos;
    this.setLoading = setLoading;
  }

  /**
   * Build the element's mount effect, fetching the document's photo shortlist, degrading to an
   * empty list on failure so a broken preview never blocks the rest of the document page.
   * Guards against updating state after unmount.
   *
   * @param {string} gameSlug - Game slug the document belongs to.
   * @param {number|string} id - `GameDocument` id.
   * @returns {Function} Effect callback.
   */
  buildEffect(gameSlug, id) {
    return () => {
      let mounted = true;

      RequestStore.ensure({
        componentName: 'DocumentPhotosPreviewController',
        resource: 'gameDocumentPhoto',
        quantityType: 'collection',
        params: { gameSlug, id },
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
