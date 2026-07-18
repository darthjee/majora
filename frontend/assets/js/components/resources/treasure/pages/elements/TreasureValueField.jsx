import FieldErrors from '../../../../common/forms/FieldErrors.jsx';
import TreasureMoney from '../../../../common/misc/TreasureMoney.jsx';

/**
 * Collapsed value display used on treasure new/edit forms, paired
 * with a button that opens the value-editing modal (see `MoneyEditModal`
 * with `context="treasure"`). Reused across the four treasure form
 * page/helper trios (`TreasureNew`, `TreasureEdit`, `GameTreasureNew`,
 * `GameTreasureEdit`), which only differ in their i18n namespace.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Label text for the value field.
 * @param {string} props.editLabel - Label text for the button that opens the value modal.
 * @param {string|number} props.value - Current treasure value, expressed in the currency's
 *   lowest denomination.
 * @param {string[]} [props.errors] - Field-level error messages for the value field.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`)
 *   determining which denominations are displayed. Defaults to `dnd`.
 * @param {Function} props.onOpenModal - Handler invoked when the edit button is clicked.
 * @returns {React.ReactElement} Rendered value field.
 */
export default function TreasureValueField({
  label, editLabel, value, errors = [], gameType = 'dnd', onOpenModal,
}) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div><TreasureMoney value={Number(value) || 0} gameType={gameType} /></div>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onOpenModal}>
        {editLabel}
      </button>
      <FieldErrors errors={errors} />
    </div>
  );
}
