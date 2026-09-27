import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';
import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import { TASK_CATEGORY_VALUES } from '../../taskCategories.js';
import { toTaskSessionPick } from '../../taskSessions.js';

const COMPLETED_VALUES = ['true', 'false'];
const SESSION_ID_PATTERN = /^\d+$/;

/**
 * Session filter mode meaning "only tasks without a session" (sent as `session=none`).
 */
export const SESSION_MODE_NONE = 'none';

/**
 * Session filter mode meaning "only tasks of the picked session" (sent as `session=<id>`).
 */
export const SESSION_MODE_SPECIFIC = 'specific';

/**
 * Manages draft filter state and query building for the TaskFilters element.
 */
export default class TaskFiltersController {
  /**
   * Creates a new TaskFiltersController instance.
   *
   * @param {Function} setCategory - state setter for the draft category field.
   * @param {Function} setCompleted - state setter for the draft completed field.
   * @param {Function} setSessionMode - state setter for the draft session mode (`''`, `'none'`
   *   or `'specific'`).
   * @param {Function} setSessionPick - state setter for the draft picked session item
   *   (`{id, name}` or null).
   */
  constructor(setCategory, setCompleted, setSessionMode, setSessionPick) {
    this.setCategory = setCategory;
    this.setCompleted = setCompleted;
    this.setSessionMode = setSessionMode;
    this.setSessionPick = setSessionPick;
  }

  /**
   * Reads the initial draft values from the hash filter params, discarding a category not in
   * `TASK_CATEGORY_VALUES` or a completed value other than `'true'`/`'false'`. A `session` of
   * `none` maps to the `none` mode; a numeric `session` maps to the `specific` mode with that id
   * pending (its title still has to be fetched); anything else maps to a blank mode.
   *
   * @param {URLSearchParams} params - filter params taken from the current hash.
   * @returns {{category: string, completed: string, sessionMode: string,
   *   sessionId: (string|null)}} initial draft values, blank when unknown.
   */
  static initialFilters(params) {
    const category = params.get('category');
    const completed = params.get('completed');

    return {
      category: TASK_CATEGORY_VALUES.includes(category) ? category : '',
      completed: COMPLETED_VALUES.includes(completed) ? completed : '',
      ...TaskFiltersController.#initialSession(params.get('session')),
    };
  }

  /**
   * Fetches a session through `RequestStore` (`session.single`) and shapes it as a picker item,
   * used to restore the picked session badge after a deep-link reload.
   *
   * @param {string} gameSlug - Slug of the session's game.
   * @param {string} id - Session id.
   * @returns {Promise<{id: number, name: string}|null>} The picker item, or null when the
   *   session could not be loaded.
   */
  static fetchSessionPick(gameSlug, id) {
    return RequestStore.ensure({
      componentName: 'TaskFilters',
      resource: 'session',
      quantityType: 'single',
      params: { gameSlug, id },
    })
      .then(({ data }) => toTaskSessionPick(data))
      .catch(() => null);
  }

  /**
   * Builds the effect restoring the picked session from a deep-linked `session=<id>`: it fetches
   * the session title and stores it as the draft pick, falling back to a blank mode when the
   * session cannot be loaded. Does nothing when there is no pending id.
   *
   * @param {string} gameSlug - Slug of the tasks' game.
   * @param {string|null} sessionId - Pending session id from the hash, or null.
   * @returns {Function} Effect callback, returning a cleanup that ignores late results.
   */
  buildSessionPickEffect(gameSlug, sessionId) {
    return () => {
      if (!sessionId) {
        return undefined;
      }

      let active = true;

      TaskFiltersController.fetchSessionPick(gameSlug, sessionId).then((pick) => {
        if (active) this.#applyFetchedPick(pick);
      });

      return () => {
        active = false;
      };
    };
  }

  /**
   * Handles a Category dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected category value.
   * @returns {void}
   */
  handleCategoryChange(value) {
    this.setCategory(value);
  }

  /**
   * Handles a Status (completed) dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected completed value (`'true'`, `'false'` or blank).
   * @returns {void}
   */
  handleCompletedChange(value) {
    this.setCompleted(value);
  }

  /**
   * Handles a Session mode dropdown change, updating the draft state. Leaving the `specific`
   * mode drops any picked session.
   *
   * @param {string} value - newly selected mode (`''`, `'none'` or `'specific'`).
   * @returns {void}
   */
  handleSessionModeChange(value) {
    this.setSessionMode(value);

    if (value !== SESSION_MODE_SPECIFIC) {
      this.setSessionPick(null);
    }
  }

  /**
   * Handles a session being picked (or cleared, with null) in the session picker.
   *
   * @param {{id: number, name: string}|null} item - picked session item, or null.
   * @returns {void}
   */
  handleSessionPick(item) {
    this.setSessionPick(item);
  }

  /**
   * Builds the query object for the Query button, omitting blank fields. `session` is `'none'`
   * in the `none` mode, the picked id in the `specific` mode, and omitted otherwise (including
   * the `specific` mode with nothing picked).
   *
   * @param {string} category - current Category dropdown value.
   * @param {string} completed - current Status dropdown value.
   * @param {string} [sessionMode] - current Session mode (`''`, `'none'` or `'specific'`).
   * @param {{id: number}|null} [sessionPick] - currently picked session item, or null.
   * @returns {{category?: string, completed?: string, session?: string}} query params to apply,
   *   with blank fields omitted.
   */
  buildQuery(category, completed, sessionMode = '', sessionPick = null) {
    return buildFilterQuery([
      ['category', category],
      ['completed', completed],
      ['session', TaskFiltersController.#sessionQueryValue(sessionMode, sessionPick)],
    ]);
  }

  /**
   * Resets every draft field to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setCategory('');
    this.setCompleted('');
    this.setSessionMode('');
    this.setSessionPick(null);
  }

  #applyFetchedPick(pick) {
    if (pick) {
      this.setSessionPick(pick);
      return;
    }

    this.setSessionMode('');
  }

  static #initialSession(session) {
    if (session === SESSION_MODE_NONE) {
      return { sessionMode: SESSION_MODE_NONE, sessionId: null };
    }

    if (SESSION_ID_PATTERN.test(session ?? '')) {
      return { sessionMode: SESSION_MODE_SPECIFIC, sessionId: session };
    }

    return { sessionMode: '', sessionId: null };
  }

  static #sessionQueryValue(sessionMode, sessionPick) {
    if (sessionMode === SESSION_MODE_NONE) {
      return SESSION_MODE_NONE;
    }

    if (sessionMode === SESSION_MODE_SPECIFIC && sessionPick) {
      return String(sessionPick.id);
    }

    return '';
  }
}
