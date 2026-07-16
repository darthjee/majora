import Translator from '../../../../../i18n/Translator.js';
import { OPTION_TYPE_DATE } from './PollOptionType.js';

/**
 * Formats a `YYYY-MM-DD` date string as a locale-formatted date, parsing it
 * by its component parts (year/month/day) instead of `new Date(value)` so
 * it is built in local time rather than parsed as UTC midnight — the latter
 * can render as the previous day in negative-UTC-offset timezones.
 *
 * @param {string} value - Date string in `YYYY-MM-DD` format.
 * @returns {string} Locale-formatted date.
 */
function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(Translator.getLanguage());
}

/**
 * Resolves the display value for a poll option, based on its poll's option
 * type.
 *
 * @param {string} optionType - Poll option type (`'text'` or `'date'`).
 * @param {string} value - Raw option value.
 * @returns {string} Display value.
 */
function resolveDisplayValue(optionType, value) {
  switch (optionType) {
    case OPTION_TYPE_DATE:
      return formatDate(value);
    default:
      return value;
  }
}

/**
 * Type-aware option display for the poll detail page: a `date`-typed poll's
 * option is formatted as a proper date, a `text`-typed one (and any
 * unrecognized option type) is shown as raw text, unchanged.
 *
 * @param {object} props - Component props.
 * @param {string} props.optionType - Poll option type (`'text'` or `'date'`).
 * @param {string} props.value - Raw option value.
 * @returns {string} Display value for the option.
 */
export default function PollOptionValue({ optionType, value }) {
  return resolveDisplayValue(optionType, value);
}
