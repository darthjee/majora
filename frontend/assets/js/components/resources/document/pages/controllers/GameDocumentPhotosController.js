import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import { buildListQuery } from '../../../../common/list_types/fetchRequestStoreList.js';

/**
 * Controller for the game document photos index page (issue #873): a bespoke, paginated photo
 * grid for a single `GameDocument`'s own `GameDocumentPhoto`s, everyone-accessible (mirroring
 * `photos.json`'s own `AllowAny` gating), with no upload/profile-photo affordance — unlike
 * `BaseCharacterPhotosController`, this fetches directly through `RequestStore.ensure()`
 * (`gameDocumentPhoto.collection`) rather than the legacy `GenericClient`, reading `page`/
 * `per_page` from the current hash via `HashRouteResolver`/`buildListQuery`, mirroring
 * `ListPageController`'s own pagination-param handling.
 */
export default class GameDocumentPhotosController extends BasePageController {
  /**
   * Extract the game slug and document id from a game document photos hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `id`).
   */
  static getParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/documents/:id/photos', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game document photos controller.
   *
   * @param {Function} setPhotos - Photos setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {HashRouteResolver} [hashResolver] - Hash resolver override, mainly for tests.
   */
  constructor(setPhotos, setPagination, setLoading, setError, hashResolver = new HashRouteResolver()) {
    super();
    this.setPhotos = setPhotos;
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
      const params = GameDocumentPhotosController.getParamsFromHash(this.hashResolver.currentHash());

      if (!params.game_slug || !params.id) {
        safeSet(this.setError, 'Unable to load photos.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchPhotos(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchPhotos(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'GameDocumentPhotosController',
      resource: 'gameDocumentPhoto',
      quantityType: 'collection',
      params: { gameSlug: params.game_slug, id: params.id },
      query: buildListQuery(this.hashResolver),
    })
      .then(({ data, pagination }) => {
        safeSet(this.setPhotos, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load photos.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
