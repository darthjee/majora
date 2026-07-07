/**
 * Manages draft filter state and query building for the NpcFilters element.
 */
export default class NpcFiltersController {
  /**
   * Creates a new NpcFiltersController instance.
   *
   * @param {Function} setStatus - state setter for the draft status field.
   * @param {Function} setName - state setter for the draft name field.
   */
  constructor(setStatus, setName) {
    this.setStatus = setStatus;
    this.setName = setName;
  }

  /**
   * Maps a `slain` query value to the Status dropdown value.
   *
   * @param {string|null} slain - raw `slain` query value (`"true"`/`"false"`/absent).
   * @returns {string} Status dropdown value (`""`/`"alive"`/`"slain"`).
   */
  static slainToStatus(slain) {
    if (slain === 'true') return 'slain';
    if (slain === 'false') return 'alive';
    return '';
  }

  /**
   * Maps a Status dropdown value to the `slain` query value.
   *
   * @param {string} status - Status dropdown value (`""`/`"alive"`/`"slain"`).
   * @returns {string} `slain` query value (`""`/`"false"`/`"true"`).
   */
  static statusToSlain(status) {
    if (status === 'alive') return 'false';
    if (status === 'slain') return 'true';
    return '';
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
   * Handles a Name field change, updating the draft state.
   *
   * @param {string} value - newly typed name value.
   * @returns {void}
   */
  handleNameChange(value) {
    this.setName(value);
  }

  /**
   * Builds the query object for the Query button, omitting blank fields.
   *
   * @param {string} status - current Status dropdown value.
   * @param {string} name - current Name field value.
   * @returns {{slain: string, name: string}} query params to apply, with blank fields omitted.
   */
  buildQuery(status, name) {
    const query = {};
    const slain = NpcFiltersController.statusToSlain(status);
    const trimmedName = name.trim();

    if (slain !== '') {
      query.slain = slain;
    }

    if (trimmedName !== '') {
      query.name = trimmedName;
    }

    return query;
  }

  /**
   * Resets both draft fields to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setStatus('');
    this.setName('');
  }
}
