import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';

/**
 * Manages draft filter state and query building for the TreasureFilters element.
 */
export default class TreasureFiltersController {
  /**
   * Creates a new TreasureFiltersController instance.
   *
   * @param {Function} setGameType - state setter for the draft game type field.
   * @param {Function} setMinValue - state setter for the draft min value field.
   * @param {Function} setMaxValue - state setter for the draft max value field.
   * @param {Function} setName - state setter for the draft name field.
   */
  constructor(setGameType, setMinValue, setMaxValue, setName) {
    this.setGameType = setGameType;
    this.setMinValue = setMinValue;
    this.setMaxValue = setMaxValue;
    this.setName = setName;
  }

  /**
   * Handles a Game type dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected game type value.
   * @returns {void}
   */
  handleGameTypeChange(value) {
    this.setGameType(value);
  }

  /**
   * Handles a Min value field change, updating the draft state.
   *
   * @param {string} value - newly typed min value.
   * @returns {void}
   */
  handleMinValueChange(value) {
    this.setMinValue(value);
  }

  /**
   * Handles a Max value field change, updating the draft state.
   *
   * @param {string} value - newly typed max value.
   * @returns {void}
   */
  handleMaxValueChange(value) {
    this.setMaxValue(value);
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
   * @param {string} gameType - current Game type dropdown value.
   * @param {string} minValue - current Min value field value.
   * @param {string} maxValue - current Max value field value.
   * @param {string} name - current Name field value.
   * @returns {{game_type: string, min_value: string, max_value: string, name: string}} query
   *   params to apply, with blank fields omitted.
   */
  buildQuery(gameType, minValue, maxValue, name) {
    return buildFilterQuery([
      ['game_type', gameType],
      ['min_value', minValue],
      ['max_value', maxValue],
      ['name', name.trim()],
    ]);
  }

  /**
   * Resets all draft fields to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setGameType('');
    this.setMinValue('');
    this.setMaxValue('');
    this.setName('');
  }
}
