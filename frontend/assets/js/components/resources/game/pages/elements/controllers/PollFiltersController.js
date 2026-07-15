/**
 * Manages draft filter state and query building for the PollFilters element.
 */
export default class PollFiltersController {
  /**
   * Creates a new PollFiltersController instance.
   *
   * @param {Function} setStatus - state setter for the draft status field.
   */
  constructor(setStatus) {
    this.setStatus = setStatus;
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
   * Builds the query object for the Query button, omitting a blank status.
   *
   * @param {string} status - current Status dropdown value.
   * @returns {{status: string}} query params to apply, with a blank status omitted.
   */
  buildQuery(status) {
    return status === '' ? {} : { status };
  }

  /**
   * Resets the draft status field to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setStatus('');
  }
}
