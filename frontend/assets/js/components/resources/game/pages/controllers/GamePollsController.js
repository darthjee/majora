import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import buildFilteredHref from '../../../../../utils/routing/buildFilteredHref.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the game polls index page.
 *
 * @description Polls are visible to (and creatable by) the game's DM(s),
 *   players, and admins alike — a wider audience than `GameTasksController`'s
 *   DM-only gate — so this controller checks the game's identity access
 *   (`is_dm`/`is_player`/`is_superuser`/`is_staff`) rather than `can_edit`,
 *   redirecting to the game page when none apply.
 */
export default class GamePollsController extends BasePageController {
  /**
   * Extract game slug from a polls index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromPollsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/polls', 'game_slug', hash);
  }

  /**
   * Build the hash URL for applying poll filters, resetting pagination to page 1.
   *
   * @param {string} basePath - Base hash path (e.g. `#/games/demo/polls`).
   * @param {{status?: string}} filters - Filters to apply, as built by
   *   `PollFiltersController#buildQuery` (blank fields already omitted).
   * @returns {string} Hash including the reset page and the active filters.
   */
  static buildFilterQueryHash(basePath, filters) {
    return buildFilteredHref(basePath, filters);
  }

  /**
   * Create a game polls controller.
   *
   * @param {Function} setPolls - Polls setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   */
  constructor(
    setPolls,
    setPagination,
    setLoading,
    setError,
  ) {
    super();
    this.setPolls = setPolls;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  /**
   * Build the page mount effect.
   *
   * @description Checks whether the current user is a DM, player, or admin
   *   of the game and redirects to the game page when they are not, before
   *   ever calling the polls endpoint (which would otherwise 401/403).
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = getCurrentHash();
      const gameSlug = GamePollsController.getGameSlugFromPollsHash(hash);

      AccessStore.ensureGameAccess(gameSlug)
        .then((access) => this.#handleAccess(access, gameSlug, safeSet))
        .catch(() => this.redirectTo(`/games/${gameSlug}`));

      return () => {
        mounted = false;
      };
    };
  }

  static #isAllowed(access) {
    return Boolean(access.is_dm || access.is_player || access.is_superuser || access.is_staff);
  }

  #handleAccess(access, gameSlug, safeSet) {
    if (!GamePollsController.#isAllowed(access)) {
      this.redirectTo(`/games/${gameSlug}`);
      return;
    }

    this.#fetchPolls(gameSlug, safeSet);
  }

  #fetchPolls(gameSlug, safeSet) {
    const hashResolver = new HashRouteResolver();

    RequestStore.ensure({
      componentName: 'GamePollsController',
      resource: 'poll',
      quantityType: 'collection',
      params: { gameSlug },
      query: {
        ...Object.fromEntries(hashResolver.getPaginationParams()),
        ...Object.fromEntries(hashResolver.getFilterParams()),
      },
    })
      .then(({ data, pagination }) => {
        safeSet(this.setPolls, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load polls.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
