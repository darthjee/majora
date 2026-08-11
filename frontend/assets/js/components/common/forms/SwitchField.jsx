import React from 'react';

/**
 * Bootstrap-switch styled checkbox input, used for boolean form fields (e.g. STL model's
 * `owned` flag). No field-errors slot is rendered — booleans never fail server-side validation.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the input.
 * @param {string} props.label - Translated label text.
 * @param {boolean} props.checked - Current checked state.
 * @param {Function} props.onChange - Change handler for the input.
 * @returns {React.ReactElement} Rendered switch field.
 */
export default function SwitchField({ id, label, checked, onChange }) {
  return (
    <div className="form-check form-switch mb-3">
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id} className="form-check-label">{label}</label>
    </div>
  );
}
