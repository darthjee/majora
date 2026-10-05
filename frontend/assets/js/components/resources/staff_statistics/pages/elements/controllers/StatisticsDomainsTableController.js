import { ASCENDING, DESCENDING } from '../../helpers/domainsSort.js';
import StatisticsTabs from '../../helpers/StatisticsTabs.js';
import statisticsHref from '../../helpers/statisticsHref.js';

/**
 * Sets the window hash (outside a browser, does nothing).
 *
 * @param {string} hash - Hash to navigate to.
 * @returns {void}
 */
function setWindowHash(hash) {
  if (typeof window !== 'undefined') window.location.hash = hash;
}

/**
 * The initial sort of the Domains table: no column, so the API order is kept.
 *
 * @type {{key: null, direction: string}}
 */
export const DEFAULT_SORT = Object.freeze({ key: null, direction: ASCENDING });

/**
 * Drives the Domains tab table (issue #1517): header sort toggling and row navigation.
 */
export default class StatisticsDomainsTableController {
  /**
   * Creates a domains table controller.
   *
   * @param {object} args - Arguments.
   * @param {Function} args.setSort - Setter of the `{ key, direction }` sort state.
   * @param {object} args.filters - Current statistics filters, carried into the row links.
   * @param {Function} [args.navigate] - Navigation function (defaults to setting
   *   `window.location.hash`).
   */
  constructor({ setSort, filters, navigate = setWindowHash }) {
    this.setSort = setSort;
    this.filters = filters;
    this.navigate = navigate;
  }

  /**
   * Computes the sort after a header click.
   *
   * @description Clicking the sorted column flips its direction; clicking another column
   *   sorts it ascending.
   * @param {{key: ?string, direction: string}} current - The current sort.
   * @param {string} key - The clicked column key.
   * @returns {{key: string, direction: string}} The next sort.
   */
  static nextSort(current, key) {
    if (current.key !== key) return { key, direction: ASCENDING };

    return { key, direction: current.direction === ASCENDING ? DESCENDING : ASCENDING };
  }

  /**
   * Toggles the sort by a column.
   *
   * @param {string} key - The clicked column key.
   * @returns {void}
   */
  toggleSort(key) {
    this.setSort((current) => StatisticsDomainsTableController.nextSort(current, key));
  }

  /**
   * Builds the Overview link of a row, filtered by its domain.
   *
   * @description Keeps the other current filters and sets `domain` to the row id (or
   *   `unknown` for the unknown row).
   * @param {{id: (number|string)}} row - A domain row.
   * @returns {string} The Overview hash path with the filters query.
   */
  rowHref(row) {
    return statisticsHref(StatisticsTabs.find('overview').path, { ...this.filters, domain: String(row.id) });
  }

  /**
   * Opens the Overview tab filtered by a row's domain.
   *
   * @param {{id: (number|string)}} row - A domain row.
   * @returns {void}
   */
  openRow(row) {
    this.navigate(this.rowHref(row));
  }

  /**
   * Opens a row from the keyboard (Enter or Space).
   *
   * @param {KeyboardEvent} event - The key down event.
   * @param {{id: (number|string)}} row - A domain row.
   * @returns {void}
   */
  handleRowKeyDown(event, row) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    this.openRow(row);
  }
}
