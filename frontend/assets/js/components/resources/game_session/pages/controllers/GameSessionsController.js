import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import Noop from '../../../../../utils/Noop.js';
import { SESSION_COLUMNS } from '../sessionColumns.js';

/**
 * Controller for game sessions index page.
 *
 * @description Fetches the past/future/unscheduled session columns in
 *   parallel, each independently paginated via its own hash query params
 *   (see `sessionColumns.js`).
 */
export default class GameSessionsController extends BasePageController {
  /**
   * Extract game slug from a sessions index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromSessionsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/sessions', 'game_slug', hash);
  }

  /**
   * Create a game sessions controller.
   *
   * @param {Function} setColumns - Setter for the 3-column state, called with an updater
   *   function `(columns) => ({...columns, [key]: {sessions, pagination}})`.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setCanEdit] - Can-edit flag setter, gates the "New session" button.
   */
  constructor(
    setColumns,
    setLoading,
    setError,
    client = null,
    setCanEdit = Noop.noop,
  ) {
    super();
    this.setColumns = setColumns;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setCanEdit = setCanEdit;
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
      const gameSlug = GameSessionsController.getGameSlugFromSessionsHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load sessions.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchAccess(gameSlug, safeSet);
        this.#fetchSessions(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchSessions(gameSlug, safeSet) {
    const query = HashQueryParams.parse(this.client.currentHash());
    const fetches = SESSION_COLUMNS.map((column) => this.#fetchColumn(gameSlug, column, query, safeSet));

    Promise.allSettled(fetches)
      .then((results) => {
        if (results.some((result) => result.status === 'rejected')) {
          safeSet(this.setError, 'Unable to load sessions.');
        }
      })
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchColumn(gameSlug, column, query, safeSet) {
    const params = {
      page: query.get(column.pageParam),
      per_page: query.get(column.perPageParam),
    };

    return this.client.fetchIndex(`/games/${gameSlug}/sessions/${column.key}.json`, params)
      .then(({ data, pagination }) => {
        safeSet(this.setColumns, (columns) => ({
          ...columns,
          [column.key]: { sessions: Array.isArray(data) ? data : [], pagination },
        }));
      });
  }

  #fetchAccess(gameSlug, safeSet) {
    AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => safeSet(this.setCanEdit, Boolean(permissions.can_edit)))
      .catch(() => safeSet(this.setCanEdit, false));
  }
}
