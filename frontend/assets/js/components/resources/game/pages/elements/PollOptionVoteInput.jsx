import React from 'react';

/**
 * Type-aware vote control for a poll option: a radio input for `single`-type
 * polls (sharing a `name` per poll so only one option can be selected at a
 * time), a checkbox for `multiple`-type polls (allowing more than one).
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Input id.
 * @param {string} props.dataTestId - `data-testid` attribute for the input.
 * @param {string} props.pollType - Poll type (`'single'` or `'multiple'`).
 * @param {string} props.name - Shared `name` for radio grouping, used for `single`-type polls.
 * @param {boolean} props.checked - Whether the option is currently selected.
 * @param {boolean} props.disabled - Whether the control is disabled (admin-only viewer).
 * @param {Function} props.onChange - Change handler for the input.
 * @returns {React.ReactElement} Type-aware vote control element.
 */
export default function PollOptionVoteInput({
  id, dataTestId, pollType, name, checked, disabled, onChange,
}) {
  return (
    <input
      id={id}
      data-testid={dataTestId}
      type={pollType === 'single' ? 'radio' : 'checkbox'}
      className="form-check-input me-2"
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
