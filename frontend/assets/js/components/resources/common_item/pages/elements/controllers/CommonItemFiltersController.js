import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';

/**
 * Manages draft filter state and query building for the CommonItemFilters element.
 */
export default class CommonItemFiltersController {
  /**
   * Creates a new CommonItemFiltersController instance.
   *
   * @param {Function} setName - state setter for the draft name field.
   * @param {Function} setCategory - state setter for the draft category field.
   * @param {Function} setMinPrice - state setter for the draft min price field.
   * @param {Function} setMaxPrice - state setter for the draft max price field.
   */
  constructor(setName, setCategory, setMinPrice, setMaxPrice) {
    this.setName = setName;
    this.setCategory = setCategory;
    this.setMinPrice = setMinPrice;
    this.setMaxPrice = setMaxPrice;
  }

  /**
   * Handles a Name field change, updating the draft state.
   *
   * @param {string} value - newly typed name.
   * @returns {void}
   */
  handleNameChange(value) {
    this.setName(value);
  }

  /**
   * Handles a Category dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected category.
   * @returns {void}
   */
  handleCategoryChange(value) {
    this.setCategory(value);
  }

  /**
   * Handles a Min price field change, updating the draft state.
   *
   * @param {string} value - newly typed min price.
   * @returns {void}
   */
  handleMinPriceChange(value) {
    this.setMinPrice(value);
  }

  /**
   * Handles a Max price field change, updating the draft state.
   *
   * @param {string} value - newly typed max price.
   * @returns {void}
   */
  handleMaxPriceChange(value) {
    this.setMaxPrice(value);
  }

  /**
   * Builds the query object for the Query action, omitting blank fields.
   *
   * @param {string} name - current Name value (trimmed).
   * @param {string} category - current Category value.
   * @param {string} minPrice - current Min price value.
   * @param {string} maxPrice - current Max price value.
   * @returns {object} query params to apply, with blank fields omitted.
   */
  buildQuery(name, category, minPrice, maxPrice) {
    return buildFilterQuery([
      ['name', name.trim()],
      ['category', category],
      ['min_price', minPrice],
      ['max_price', maxPrice],
    ]);
  }

  /**
   * Resets all draft fields to blank.
   *
   * @returns {void}
   */
  clear() {
    this.setName('');
    this.setCategory('');
    this.setMinPrice('');
    this.setMaxPrice('');
  }
}
