/**
 * Poll option type: plain text, the current/default behaviour.
 *
 * @type {string}
 */
export const OPTION_TYPE_TEXT = 'text';

/**
 * Poll option type: a calendar date, entered via a native date picker and
 * displayed as a formatted date.
 *
 * @type {string}
 */
export const OPTION_TYPE_DATE = 'date';

/**
 * Ordered list of the known poll option types. This is the single place
 * that lists them, so adding a new option type later means adding one entry
 * here plus one `case` in each of `PollOptionInput` and `PollOptionValue`.
 *
 * @type {string[]}
 */
export const OPTION_TYPES = [OPTION_TYPE_TEXT, OPTION_TYPE_DATE];
