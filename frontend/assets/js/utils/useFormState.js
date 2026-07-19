import { useState } from 'react';

/**
 * Builds a `setField(field, value)` function bound to the given React state setter, merging
 * the new value onto the previous state object. Extracted as a plain function (rather than
 * inlined in the hook) so it can be exercised directly in specs without depending on React's
 * state/commit cycle (`useState` setters don't apply outside a live render, so the underlying
 * merge logic isn't otherwise testable in isolation).
 *
 * @param {Function} setState - React state setter for the field-value object.
 * @returns {Function} `setField(field, value)`, merging `{ [field]: value }` onto the state.
 */
export function buildSetField(setState) {
  return (field, value) => setState((prev) => ({ ...prev, [field]: value }));
}

/**
 * Builds a `handleChange(field)` factory returning an `onChange` handler that reads
 * `event.target.value` into the given field via `setField`.
 *
 * @param {Function} setField - `setField(field, value)`, as built by {@link buildSetField}.
 * @returns {Function} `handleChange(field)` factory.
 */
export function buildHandleChange(setField) {
  return (field) => (event) => setField(field, event.target.value);
}

/**
 * Builds a `handleCheckboxChange(field)` factory returning an `onChange` handler that reads
 * `event.target.checked` into the given field via `setField`.
 *
 * @param {Function} setField - `setField(field, value)`, as built by {@link buildSetField}.
 * @returns {Function} `handleCheckboxChange(field)` factory.
 */
export function buildHandleCheckboxChange(setField) {
  return (field) => (event) => setField(field, event.target.checked);
}

/**
 * Reusable page-level hook consolidating a group of related form field values into a single
 * state object, replacing the common pattern of one independent `useState` call per field plus
 * an inline `onChange` closure per input. Covers the two shapes every New/Edit page needs:
 * plain value inputs (`event.target.value`, e.g. text/select fields) and checkboxes
 * (`event.target.checked`).
 *
 * @param {object} initial - Initial field values, keyed by field name.
 * @returns {{state: object, setState: Function, setField: Function, handleChange: Function,
 *   handleCheckboxChange: Function}} `state` — the current field values; `setState` — the raw
 *   React state setter, for callers needing to replace the whole object (e.g. after loading a
 *   resource); `setField(field, value)` — sets a single field directly, for values that don't
 *   come from a DOM change event (e.g. a modal's confirm callback); `handleChange(field)` —
 *   returns an `onChange` handler reading `event.target.value` into that field;
 *   `handleCheckboxChange(field)` — same, reading `event.target.checked` instead.
 */
export default function useFormState(initial) {
  const [state, setState] = useState(initial);
  const setField = buildSetField(setState);

  return {
    state,
    setState,
    setField,
    handleChange: buildHandleChange(setField),
    handleCheckboxChange: buildHandleCheckboxChange(setField),
  };
}
