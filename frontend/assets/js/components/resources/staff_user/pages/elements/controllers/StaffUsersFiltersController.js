import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';

/**
 * Manages draft filter state and query building for the StaffUsersFilters element.
 */
export default class StaffUsersFiltersController {
  /**
   * Creates a new StaffUsersFiltersController instance.
   *
   * @param {Function} setStatus - state setter for the draft status field.
   * @param {Function} setSearch - state setter for the draft search field.
   */
  constructor(setStatus, setSearch) {
    this.setStatus = setStatus;
    this.setSearch = setSearch;
  }

  /**
   * Handles a Status dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected status value.
   * @returns {void}
   */
  handleStatusChange(value) {
    this.setStatus(value);
  }

  /**
   * Handles a Search field change, updating the draft state.
   *
   * @param {string} value - newly typed search value.
   * @returns {void}
   */
  handleSearchChange(value) {
    this.setSearch(value);
  }

  /**
   * Builds the query object for the Query button, omitting blank fields.
   *
   * @param {string} status - current Status dropdown value.
   * @param {string} search - current Search field value.
   * @returns {{status: string, search: string}} query params to apply, with blank fields omitted.
   */
  buildQuery(status, search) {
    return buildFilterQuery([
      ['status', status],
      ['search', search.trim()],
    ]);
  }

  /**
   * Resets all draft fields to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setStatus('');
    this.setSearch('');
  }
}
