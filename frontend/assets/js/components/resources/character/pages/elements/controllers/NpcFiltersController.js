import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';

/**
 * Manages draft filter state and query building for the NpcFilters element.
 */
export default class NpcFiltersController {
  /**
   * Creates a new NpcFiltersController instance.
   *
   * @param {Function} setStatus - state setter for the draft status field.
   * @param {Function} setName - state setter for the draft name field.
   * @param {Function} setAllegiance - state setter for the draft allegiance field.
   * @param {Function} [setHidden] - state setter for the draft hidden field.
   */
  constructor(setStatus, setName, setAllegiance, setHidden) {
    this.setStatus = setStatus;
    this.setName = setName;
    this.setAllegiance = setAllegiance;
    this.setHidden = setHidden;
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
   * Maps a `hidden` query value to the Hidden dropdown value.
   *
   * @param {string|null} hidden - raw `hidden` query value (`"true"`/`"false"`/absent).
   * @returns {string} Hidden dropdown value (`""`/`"shown"`/`"hidden"`).
   */
  static hiddenToFilter(hidden) {
    if (hidden === 'true') return 'hidden';
    if (hidden === 'false') return 'shown';
    return '';
  }

  /**
   * Maps a Hidden dropdown value to the `hidden` query value.
   *
   * @param {string} filter - Hidden dropdown value (`""`/`"shown"`/`"hidden"`).
   * @returns {string} `hidden` query value (`""`/`"false"`/`"true"`).
   */
  static filterToHidden(filter) {
    if (filter === 'shown') return 'false';
    if (filter === 'hidden') return 'true';
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
   * Handles an Allegiance dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected allegiance value.
   * @returns {void}
   */
  handleAllegianceChange(value) {
    this.setAllegiance(value);
  }

  /**
   * Handles a Hidden dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected hidden filter value.
   * @returns {void}
   */
  handleHiddenChange(value) {
    this.setHidden(value);
  }

  /**
   * Builds the query object for the Query button, omitting blank fields.
   *
   * @param {string} status - current Status dropdown value.
   * @param {string} name - current Name field value.
   * @param {string} allegiance - current Allegiance dropdown value.
   * @param {string} [hidden] - current Hidden dropdown value.
   * @returns {{slain: string, name: string, allegiance: string, hidden: string}} query params
   *   to apply, with blank fields omitted.
   */
  buildQuery(status, name, allegiance, hidden = '') {
    return buildFilterQuery([
      ['slain', NpcFiltersController.statusToSlain(status)],
      ['name', name.trim()],
      ['allegiance', allegiance],
      ['hidden', NpcFiltersController.filterToHidden(hidden)],
    ]);
  }

  /**
   * Resets all draft fields to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setStatus('');
    this.setName('');
    this.setAllegiance('');
    this.setHidden('');
  }
}
