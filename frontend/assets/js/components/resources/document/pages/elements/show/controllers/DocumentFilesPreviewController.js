import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import { MAX_PREVIEW_FILES } from '../../../../../../common/cards/characterPreviewConstants.js';

/**
 * Manages the DocumentFilesPreview element's own fetch of a `GameDocument`'s file shortlist
 * (issue #873), through {@link RequestStore.ensure} (`gameDocumentFile.collection`), mirroring
 * `DocumentPhotosPreviewController` exactly.
 */
export default class DocumentFilesPreviewController {
  /**
   * Creates a new DocumentFilesPreviewController instance.
   *
   * @param {Function} setFiles - State setter for the fetched preview files.
   * @param {Function} setLoading - State setter for the loading flag.
   */
  constructor(setFiles, setLoading) {
    this.setFiles = setFiles;
    this.setLoading = setLoading;
  }

  /**
   * Build the element's mount effect, fetching the document's file shortlist, degrading to an
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
        componentName: 'DocumentFilesPreviewController',
        resource: 'gameDocumentFile',
        quantityType: 'collection',
        params: { gameSlug, id },
        query: { per_page: MAX_PREVIEW_FILES },
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
