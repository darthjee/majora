import Translator from '../../../../../i18n/Translator.js';

const SERIES = [
  { key: 'anonymous', color: 'var(--majora-chart-1)' },
  { key: 'logged_in', color: 'var(--majora-chart-2)' },
];

/**
 * Resolves the visible Visits chart series in stack order.
 *
 * @description `anonymous` always comes first (bottom of the stack), then `logged_in`,
 *   whatever the order of the given keys. Labels are translated on every call so they follow
 *   the current locale.
 * @param {string[]} keys - Visible series keys (`anonymous` and/or `logged_in`).
 * @returns {{key: string, color: string, label: string}[]} The visible series.
 */
export default function visitsSeries(keys) {
  return SERIES
    .filter(({ key }) => keys.includes(key))
    .map(({ key, color }) => ({
      key, color, label: Translator.t(`staff_statistics_page.visits.${key}`),
    }));
}
