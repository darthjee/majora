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
 * Drives the Users tab table (issue #1520): row navigation to the Overview tab.
 *
 * @description Sorting is server-side and lives in the URL (the headers are plain links), so
 *   this controller only handles the row links.
 */
export default class StatisticsUsersTableController {
  /**
   * Creates a users table controller.
   *
   * @param {object} args - Arguments.
   * @param {object} args.filters - Current statistics filters, carried into the row links.
   * @param {Function} [args.navigate] - Navigation function (defaults to setting
   *   `window.location.hash`).
   */
  constructor({ filters, navigate = setWindowHash }) {
    this.filters = filters;
    this.navigate = navigate;
  }

  /**
   * Builds the Overview link of a row, filtered by its user.
   *
   * @description Keeps the other current filters and sets `user` to the row id.
   * @param {{id: (number|string)}} row - A user row.
   * @returns {string} The Overview hash path with the filters query.
   */
  rowHref(row) {
    return statisticsHref(StatisticsTabs.find('overview').path, { ...this.filters, user: String(row.id) });
  }

  /**
   * Opens the Overview tab filtered by a row's user.
   *
   * @param {{id: (number|string)}} row - A user row.
   * @returns {void}
   */
  openRow(row) {
    this.navigate(this.rowHref(row));
  }

  /**
   * Opens a row from the keyboard (Enter or Space).
   *
   * @description Ignores keys bubbling up from a nested element (e.g. the profile link), so
   *   activating that link does not also open the row.
   * @param {KeyboardEvent} event - The key down event.
   * @param {{id: (number|string)}} row - A user row.
   * @returns {void}
   */
  handleRowKeyDown(event, row) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target !== event.currentTarget) return;

    event.preventDefault();
    this.openRow(row);
  }
}
