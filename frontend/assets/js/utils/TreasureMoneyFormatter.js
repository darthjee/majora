import CoinBreakdown from './CoinBreakdown.js';
import Translator from '../i18n/Translator.js';

const DENOMINATIONS = ['cp', 'sp', 'gp'];
const CASCADE_THRESHOLD = 10;

const ABBREVIATION_KEYS = {
  cp: 'money.cp_abbreviation',
  sp: 'money.sp_abbreviation',
  gp: 'money.gp_abbreviation',
};

/**
 * Format a single coin denomination entry into its display string.
 *
 * @param {{key: string, quantity: number}} entry - Denomination entry.
 * @returns {string} Formatted entry (e.g. `5 SP`).
 */
function formatEntry(entry) {
  return `${entry.quantity} ${Translator.t(ABBREVIATION_KEYS[entry.key])}`;
}

/**
 * Join formatted denomination strings with commas, using a trailing "and"
 * before the last entry.
 *
 * @param {string[]} formattedEntries - Formatted denomination strings.
 * @returns {string} The joined string.
 */
function joinEntries(formattedEntries) {
  if (formattedEntries.length <= 1) {
    return formattedEntries.join('');
  }

  const last = formattedEntries[formattedEntries.length - 1];
  const rest = formattedEntries.slice(0, -1);

  return `${rest.join(', ')} and ${last}`;
}

/**
 * Formats a raw treasure value (expressed in copper pieces) into a
 * human-readable CP/SP/GP breakdown, ordered from highest to lowest
 * denomination. A value of 0 renders as `0 GP`, unlike the character-money
 * breakdown which renders nothing for 0.
 *
 * @param {number} [value] - Treasure value, expressed in copper pieces.
 * @returns {string} The formatted breakdown string (e.g. `1000 GP, 5 SP and 2 CP`).
 */
export default function formatTreasureValue(value = 0) {
  const entries = new CoinBreakdown({
    denominations: DENOMINATIONS,
    cascadeThreshold: CASCADE_THRESHOLD,
  }).build(value);

  if (entries.length === 0) {
    return formatEntry({ key: 'gp', quantity: 0 });
  }

  return joinEntries(entries.reverse().map(formatEntry));
}
