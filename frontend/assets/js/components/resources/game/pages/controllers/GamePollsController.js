import PollClient from '../../../../../client/PollClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

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
    const params = new URLSearchParams({ page: '1', ...filters });
    return `${basePath}?${params.toString()}`;
  }

  /**
   * Create a game polls controller.
   *
   * @param {Function} setPolls - Polls setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {PollClient|null} [pollClient] - Poll client override.
   */
  constructor(
    setPolls,
    setPagination,
    setLoading,
    setError,
    pollClient = null,
  ) {
    super();
    this.setPolls = setPolls;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.pollClient = pollClient ?? new PollClient();
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
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = GamePollsController.getGameSlugFromPollsHash(hash);

      AccessStore.ensureGameAccess(gameSlug)
        .then((access) => this.#handleAccess(access, gameSlug, safeSet))
        .catch(() => this.#redirectToGame(gameSlug));

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
      this.#redirectToGame(gameSlug);
      return;
    }

    this.#fetchPolls(gameSlug, safeSet);
  }

  #redirectToGame(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}`;
    }
  }

  #fetchPolls(gameSlug, safeSet) {
    const token = AuthStorage.getToken();
    const hashResolver = new HashRouteResolver();
    const params = new URLSearchParams([
      ...hashResolver.getPaginationParams(),
      ...hashResolver.getFilterParams(),
    ]);

    this.pollClient.fetchPolls(gameSlug, token, params)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Request failed');
        }

        return response.json().then((data) => ({ data, headers: response.headers }));
      })
      .then(({ data, headers }) => {
        safeSet(this.setPolls, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, {
          page: this.#parseInt(headers.get('page'), 1),
          pages: this.#parseInt(headers.get('pages'), 1),
          perPage: this.#parseInt(headers.get('per_page'), 10),
        });
      })
      .catch(() => safeSet(this.setError, 'Unable to load polls.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #parseInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }
}
