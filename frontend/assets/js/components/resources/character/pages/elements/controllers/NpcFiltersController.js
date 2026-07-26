import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';

/**
 * Manages draft filter state and query building for the NpcFilters element.
 */
export default class NpcFiltersController {
  /**
   * Creates a new NpcFiltersController instance.
   *
   * @param {Function} setStatus - state setter for the draft public-status field.
   * @param {Function} setName - state setter for the draft name field.
   * @param {Function} setAllegiance - state setter for the draft public-allegiance field.
   * @param {Function} [setHidden] - state setter for the draft hidden field.
   * @param {Function} [setPrivateStatus] - state setter for the draft private-status field
   *   (dm/admin only).
   * @param {Function} [setPrivateAllegiance] - state setter for the draft private-allegiance
   *   field (dm/admin only).
   */
  constructor(setStatus, setName, setAllegiance, setHidden, setPrivateStatus, setPrivateAllegiance) {
    this.setStatus = setStatus;
    this.setName = setName;
    this.setAllegiance = setAllegiance;
    this.setHidden = setHidden;
    this.setPrivateStatus = setPrivateStatus;
    this.setPrivateAllegiance = setPrivateAllegiance;
  }

  /**
   * Maps a `public_slain`/`private_slain` query value to a Status dropdown value.
   *
   * @param {string|null} slain - raw slain query value (`"true"`/`"false"`/absent).
   * @returns {string} Status dropdown value (`""`/`"alive"`/`"slain"`).
   */
  static slainToStatus(slain) {
    if (slain === 'true') return 'slain';
    if (slain === 'false') return 'alive';
    return '';
  }

  /**
   * Maps a Status dropdown value to a `public_slain`/`private_slain` query value.
   *
   * @param {string} status - Status dropdown value (`""`/`"alive"`/`"slain"`).
   * @returns {string} slain query value (`""`/`"false"`/`"true"`).
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
   * Handles a public Status dropdown change, updating the draft state.
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
   * Handles a public Allegiance dropdown change, updating the draft state.
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
   * Handles a private Status dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected private-status value.
   * @returns {void}
   */
  handlePrivateStatusChange(value) {
    this.setPrivateStatus(value);
  }

  /**
   * Handles a private Allegiance dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected private-allegiance value.
   * @returns {void}
   */
  handlePrivateAllegianceChange(value) {
    this.setPrivateAllegiance(value);
  }

  /**
   * Builds the query object for the Query button, omitting blank fields.
   *
   * @param {string} status - current public Status dropdown value.
   * @param {string} name - current Name field value.
   * @param {string} allegiance - current public Allegiance dropdown value.
   * @param {string} [hidden] - current Hidden dropdown value.
   * @param {string} [privateStatus] - current private Status dropdown value (dm/admin only).
   * @param {string} [privateAllegiance] - current private Allegiance dropdown value (dm/admin
   *   only).
   * @returns {{public_slain: string, name: string, public_allegiance: string, hidden: string,
   *   private_slain: string, private_allegiance: string}} query params to apply, with blank
   *   fields omitted.
   */
  buildQuery(status, name, allegiance, hidden = '', privateStatus = '', privateAllegiance = '') {
    return buildFilterQuery([
      ['public_slain', NpcFiltersController.statusToSlain(status)],
      ['name', name.trim()],
      ['public_allegiance', allegiance],
      ['hidden', NpcFiltersController.filterToHidden(hidden)],
      ['private_slain', NpcFiltersController.statusToSlain(privateStatus)],
      ['private_allegiance', privateAllegiance],
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
    this.setPrivateStatus('');
    this.setPrivateAllegiance('');
  }
}
