import Translator from '../../../../../i18n/Translator.js';

/**
 * Ordered access statistics tabs: key, hash route path and label i18n key.
 *
 * @type {Array<{key: string, path: string, labelKey: string}>}
 */
export const STATISTICS_TABS = Object.freeze([
  ['overview', '/staff/statistics'],
  ['visits', '/staff/statistics/visits'],
  ['visitors', '/staff/statistics/visitors'],
  ['duration', '/staff/statistics/duration'],
  ['domains', '/staff/statistics/domains'],
  ['users', '/staff/statistics/users'],
  ['visit_list', '/staff/statistics/visit-list'],
].map(([key, path]) => Object.freeze({ key, path, labelKey: `staff_statistics_page.tabs.${key}` })));

/**
 * Lookup helpers over {@link STATISTICS_TABS}, shared by the tab nav and the tab pages.
 */
export default class StatisticsTabs {
  /**
   * Finds a tab by key.
   *
   * @param {string} key - Tab key (e.g. `visits`).
   * @returns {{key: string, path: string, labelKey: string}} The tab, or the Overview tab when
   *   the key is unknown.
   */
  static find(key) {
    return STATISTICS_TABS.find((tab) => tab.key === key) ?? STATISTICS_TABS[0];
  }

  /**
   * Returns a tab's hash path (with the leading `#`).
   *
   * @param {string} key - Tab key.
   * @returns {string} The tab's hash path (e.g. `#/staff/statistics/visits`).
   */
  static hashPath(key) {
    return `#${StatisticsTabs.find(key).path}`;
  }

  /**
   * Returns a tab's translated label.
   *
   * @param {{labelKey: string}} tab - Tab entry.
   * @returns {string} The translated label.
   */
  static label(tab) {
    return Translator.t(tab.labelKey);
  }
}
