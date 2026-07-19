import PollOptionInput from '../../resources/game/pages/elements/PollOptionInput.jsx';
import Icons from '../../../utils/ui/Icons.js';

/**
 * Renders one row of a dynamically-growing option list (poll options, poll session
 * dates, ...): a type-aware {@link PollOptionInput} plus a remove button, hidden only
 * for the trailing blank row (so the list always keeps exactly one blank row to type
 * into). Shared by `GamePollNewHelper` and `CreateSessionPollModalHelper`.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Input id.
 * @param {string} props.testId - `data-testid` attribute for the input.
 * @param {string} props.removeTestId - `data-testid` attribute for the remove button.
 * @param {string} props.optionType - Poll option type (`'text'` or `'date'`), forwarded
 *   to `PollOptionInput`.
 * @param {string} props.value - Current row value.
 * @param {boolean} props.isLast - Whether this is the last row in the list; combined with
 *   an empty `value`, hides the remove button.
 * @param {Function} props.onChange - Change handler for the input.
 * @param {Function} props.onRemove - Click handler for the remove button.
 * @returns {React.ReactElement} Rendered option row.
 */
export default function RemovableOptionRow({
  id, testId, removeTestId, optionType, value, isLast, onChange, onRemove,
}) {
  const isBlank = value.trim() === '';

  return (
    <div className="input-group mb-2">
      <PollOptionInput id={id} dataTestId={testId} optionType={optionType} value={value} onChange={onChange} />
      {!(isLast && isBlank) && (
        <button type="button" className="btn btn-outline-danger" data-testid={removeTestId} onClick={onRemove}>
          <i className={`bi ${Icons.trash}`} aria-hidden="true"></i>
        </button>
      )}
    </div>
  );
}
