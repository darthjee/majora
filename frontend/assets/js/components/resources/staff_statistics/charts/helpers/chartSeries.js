import Translator from '../../../../../i18n/Translator.js';

/**
 * Anonymous vs logged-in series, bottom of the stack first.
 *
 * @type {{key: string, color: string}[]}
 */
export const AUDIENCE_SERIES = [
  { key: 'anonymous', color: 'var(--majora-chart-1)' },
  { key: 'logged_in', color: 'var(--majora-chart-2)' },
];

/**
 * New vs returning visitors series, bottom of the stack first.
 *
 * @type {{key: string, color: string, labelKey: string}[]}
 */
export const NEW_RETURNING_SERIES = [
  { key: 'new_visitors', color: 'var(--majora-chart-3)', labelKey: 'new' },
  { key: 'returning_visitors', color: 'var(--majora-chart-4)', labelKey: 'returning' },
];

/**
 * Resolves the visible chart series in stack order.
 *
 * @description Keeps the order of `definitions` (bottom of the stack first) whatever the
 *   order of the given keys, dropping the series whose `key` is not visible. Each label is
 *   translated on every call (so it follows the current locale) from
 *   `${labelPrefix}.${labelKey}`, where `labelKey` is the definition's explicit `labelKey`
 *   when present and its `key` otherwise.
 * @param {{key: string, color: string, labelKey?: string}[]} definitions - Series
 *   definitions in stack order.
 * @param {string[]} keys - Visible series keys.
 * @param {string} labelPrefix - Translation key prefix of the labels.
 * @returns {{key: string, color: string, label: string}[]} The visible series.
 */
export function chartSeries(definitions, keys, labelPrefix) {
  return definitions
    .filter(({ key }) => keys.includes(key))
    .map(({ key, color, labelKey = key }) => ({
      key, color, label: Translator.t(`${labelPrefix}.${labelKey}`),
    }));
}
