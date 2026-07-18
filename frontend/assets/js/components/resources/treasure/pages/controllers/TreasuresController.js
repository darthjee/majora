import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Controller for treasures index page.
 */
export default class TreasuresController extends BasePageController {
  /**
   * Build the hash URL for applying treasure filters, resetting pagination to page 1.
   *
   * @param {string} basePath - Base hash path (e.g. `#/treasures`).
   * @param {{game_type?: string, min_value?: string, max_value?: string, name?: string}} filters -
   *   Filters to apply, as built by `TreasureFiltersController#buildQuery` (blank fields already
   *   omitted).
   * @returns {string} Hash including the reset page and the active filters.
   */
  static buildFilterQueryHash(basePath, filters) {
    const params = new URLSearchParams({ page: '1', ...filters });
    return `${basePath}?${params.toString()}`;
  }

  /**
   * Create a treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setIsSuperUser] - Superuser/staff flag setter, for consistency/testability
   *   with the other index-page controllers (e.g. `ListPageController`'s `setCanEdit`) — this page
   *   is only ever reached by staff/superusers, since any other user is redirected away below.
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setIsSuperUser = Noop.noop,
  ) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setIsSuperUser = setIsSuperUser;
    this.hashResolver = new HashRouteResolver(() => this.client.currentHash());
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects users who are neither staff nor superusers to the
   *   home page before fetching the treasures index.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!mounted) {
          return;
        }

        if (!isStaffOrSuperUser) {
          if (typeof window !== 'undefined') {
            window.location.hash = '/';
          }
          return;
        }

        safeSet(this.setIsSuperUser, true);

        const filterParams = Object.fromEntries(this.hashResolver.getFilterParams());

        this.client.fetchIndex('/treasures.json', filterParams)
          .then(({ data, pagination }) => {
            safeSet(this.setTreasures, Array.isArray(data) ? data : []);
            safeSet(this.setPagination, pagination);
          })
          .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
          .finally(() => safeSet(this.setLoading, false));
      });

      return () => {
        mounted = false;
      };
    };
  }
}
