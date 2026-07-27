import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import { buildListQuery } from '../../../../common/list_types/fetchRequestStoreList.js';

/**
 * Controller for the game document files index page (issue #873): a bespoke, paginated file
 * grid for a single `GameDocument`'s own `GameDocumentFile`s, everyone-accessible, mirroring
 * `GameDocumentPhotosController` exactly, just fetching `gameDocumentFile.collection` instead.
 */
export default class GameDocumentFilesController extends BasePageController {
  /**
   * Extract the game slug and document id from a game document files hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/documents/:id/files', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game document files controller.
   *
   * @param {Function} setFiles - Files setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {HashRouteResolver} [hashResolver] - Hash resolver override, mainly for tests.
   */
  constructor(setFiles, setPagination, setLoading, setError, hashResolver = new HashRouteResolver()) {
    super();
    this.setFiles = setFiles;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.hashResolver = hashResolver;
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
      const params = GameDocumentFilesController.getParamsFromHash(this.hashResolver.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load files.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchFiles(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchFiles(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameDocumentFilesController',
      resource: 'gameDocumentFile',
      quantityType: 'collection',
      params: { gameSlug: params.game_slug, id: params.id },
      query: buildListQuery(this.hashResolver),
    })
      .then(({ data, pagination }) => {
        safeSet(this.setFiles, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load files.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
