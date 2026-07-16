import { OPTION_TYPE_DATE } from './PollOptionType.js';

/**
 * Resolves the native `<input>` type to use for a given poll option type.
 *
 * @param {string} optionType - Poll option type (`'text'` or `'date'`).
 * @returns {string} Native input type, either `'date'` or `'text'`.
 */
function resolveInputType(optionType) {
  switch (optionType) {
    case OPTION_TYPE_DATE:
      return 'date';
    default:
      return 'text';
  }
}

/**
 * Type-aware option input for the poll creation form: a native date picker
 * for `date`-typed polls, a plain text input for `text`-typed ones (and as
 * the fallback for any unrecognized option type).
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Input id.
 * @param {string} props.dataTestId - `data-testid` attribute for the input.
 * @param {string} props.optionType - Poll option type (`'text'` or `'date'`).
 * @param {string} props.value - Current option value.
 * @param {Function} props.onChange - Change handler for the input.
 * @returns {React.ReactElement} Type-aware option input element.
 */
export default function PollOptionInput({
  id, dataTestId, optionType, value, onChange,
}) {
  return (
    <input
      id={id}
      data-testid={dataTestId}
      type={resolveInputType(optionType)}
      className="form-control"
      value={value}
      onChange={onChange}
    />
  );
}
