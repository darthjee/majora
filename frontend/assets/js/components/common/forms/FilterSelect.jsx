/**
 * Labeled `<select>` filter control, wrapped in the `col-auto` spacing used
 * by the app's filter bars (NPC/treasure/poll filters).
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor`, the select, and its
 *   `data-testid` (unless `testId` is given).
 * @param {string} props.label - Translated label text.
 * @param {string} props.value - Current selected value.
 * @param {{value: string, label: string}[]} props.options - Selectable options, rendered after
 *   a leading blank option.
 * @param {Function} props.onChange - Called with the newly selected value.
 * @param {string} [props.testId] - Override for `data-testid`. Defaults to `id`.
 * @returns {React.ReactElement} Rendered filter select control.
 */
export default function FilterSelect({ id, label, value, options, onChange, testId }) {
  return (
    <div className="col-auto">
      <label htmlFor={id} className="form-label">{label}</label>
      <select
        id={id}
        data-testid={testId ?? id}
        className="form-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
