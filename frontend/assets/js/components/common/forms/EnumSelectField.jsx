import React from 'react';

/**
 * Reusable enum `<select>` field: renders one translated option per raw `db_value` in `values`,
 * optionally preceded by a blank option mapping to `''` (converted to `null` at the caller's
 * request-body boundary, not here). Used for STL model's `type`/`race`/`role` fields, replacing
 * copy-pasting `GameTypeSelect.jsx`'s shape once per enum field.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the select.
 * @param {string} props.label - Translated field label.
 * @param {string[]} props.values - Ordered list of raw `db_value`s (no blank option baked in).
 * @param {Function} props.translateOption - `(value) => label string` for each option.
 * @param {string} props.value - Currently selected value, or `''` for the nullable blank option.
 * @param {boolean} [props.nullable] - When true, renders a leading blank option mapping to `''`.
 * @param {string} [props.noneLabel] - Label for the blank option (required when `nullable`).
 * @param {Function} props.onChange - Change handler for the select.
 * @returns {React.ReactElement} Rendered enum select field.
 */
export default function EnumSelectField({
  id, label, values, translateOption, value, nullable = false, noneLabel, onChange,
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <select id={id} className="form-select" value={value} onChange={onChange}>
        {nullable && <option value="">{noneLabel}</option>}
        {values.map((v) => <option key={v} value={v}>{translateOption(v)}</option>)}
      </select>
    </div>
  );
}
