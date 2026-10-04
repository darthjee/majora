import RequestStore from '../../../../../../utils/requests/RequestStore.js';

/**
 * Debounce delay (ms) applied to the user search input before fetching.
 *
 * @type {number}
 */
export const USER_SEARCH_DEBOUNCE_MS = 300;

const COMPONENT_NAME = 'StaffStatisticsUserSelect';

/**
 * Drives the access statistics user select: the debounced user search and the label of a
 * user id loaded from the URL.
 */
export default class StaffStatisticsUserSelectController {
  /**
   * Creates a user select controller.
   *
   * @param {object} args - Arguments.
   * @param {Function} args.setResults - Setter of the search results list.
   * @param {Function} args.setSearched - Setter of the "a search completed" flag.
   * @param {Function} args.setSelected - Setter of the selected user's label state
   *   (`{id, name, deleted}`).
   */
  constructor({ setResults, setSearched, setSelected }) {
    this.setResults = setResults;
    this.setSearched = setSearched;
    this.setSelected = setSelected;
  }

  /**
   * Builds the debounced search effect for a search term.
   *
   * @description A blank term clears the results at once; otherwise the search runs after
   *   {@link USER_SEARCH_DEBOUNCE_MS}. The cleanup cancels a pending or in-flight search.
   * @param {string} searchTerm - Current search input value.
   * @returns {Function} Effect callback returning its cleanup.
   */
  buildSearchEffect(searchTerm) {
    return () => {
      let active = true;
      const term = searchTerm.trim();

      if (!term) {
        this.setResults([]);
        this.setSearched(false);
        return () => { active = false; };
      }

      const timeoutId = setTimeout(() => this.search(term, () => active), USER_SEARCH_DEBOUNCE_MS);

      return () => {
        active = false;
        clearTimeout(timeoutId);
      };
    };
  }

  /**
   * Builds the effect resolving the label of the selected user id.
   *
   * @param {string|null} userId - Selected user id (from the URL), or `null` for "any".
   * @returns {Function} Effect callback returning its cleanup.
   */
  buildSelectedEffect(userId) {
    return () => {
      let active = true;

      if (userId === null || userId === undefined) {
        this.setSelected(null);
      } else {
        this.resolveSelected(userId, () => active);
      }

      return () => { active = false; };
    };
  }

  /**
   * Searches users through `staffUser` / `collection` (`GET /staff/users.json?search=`).
   *
   * @param {string} term - Search text.
   * @param {Function} [isActive] - Returns `false` once the result is stale.
   * @returns {Promise<void>} Resolves once the results were set (empty on failure).
   */
  search(term, isActive = () => true) {
    return RequestStore.ensure({
      componentName: COMPONENT_NAME,
      resource: 'staffUser',
      quantityType: 'collection',
      query: { search: term },
    })
      .then(({ data }) => (Array.isArray(data) ? data : []))
      .catch(() => [])
      .then((results) => {
        if (!isActive()) return;

        this.setResults(results);
        this.setSearched(true);
      });
  }

  /**
   * Resolves a user id's label through `staffUser` / `single` (`GET /staff/users/<id>.json`).
   *
   * @description On failure (e.g. a `404` for a deleted user) the selection is kept and
   *   flagged as `deleted`, so the bar shows `#<id>` with a "deleted user" hint.
   * @param {string} userId - User id.
   * @param {Function} [isActive] - Returns `false` once the result is stale.
   * @returns {Promise<void>} Resolves once the selected label was set.
   */
  resolveSelected(userId, isActive = () => true) {
    return RequestStore.ensure({
      componentName: COMPONENT_NAME,
      resource: 'staffUser',
      quantityType: 'single',
      params: { id: userId },
    })
      .then(({ data }) => ({ id: userId, name: data?.name ?? null, deleted: false }))
      .catch(() => ({ id: userId, name: null, deleted: true }))
      .then((selected) => {
        if (isActive()) this.setSelected(selected);
      });
  }
}
