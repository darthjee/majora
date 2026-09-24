import { useState } from 'react';
import SingleResourcePickerFieldHelper from './helpers/SingleResourcePickerFieldHelper.jsx';

/**
 * Build the field wrapper's `blur` handler: closes the search (via `onCancel`) only when focus
 * leaves the field entirely — a blur whose `relatedTarget` is still inside the wrapper (e.g.
 * focus moving from the search input to a result row) is ignored, so the row's click still
 * registers. Exported as a plain, named function so it can be exercised directly in specs.
 *
 * @param {Function} onCancel - Called when focus moves outside the field's container.
 * @returns {Function} `(event) => void` blur handler.
 */
export function buildFieldBlurHandler(onCancel) {
  return (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    onCancel();
  };
}

/**
 * Single-pick wrapper around `ResourcePickerSearch`: shows the search core while no item is
 * picked, then swaps to a plain (non-removable) `Badge` for the picked item — clicking that
 * badge re-opens the search so a different item can be picked, replacing `value`. There is no
 * separate "clear to none" affordance; re-picking is the only way to change a selection. While
 * re-picking, `Escape` in the search input or focus leaving the field closes the search and
 * keeps the current `value`.
 *
 * Like `MultiResourcePickerField`, it works in API mode (`picker.resource`/`picker.maxEntries`)
 * or constant mode (`picker.values`/`picker.translateOption`), where the picked item is shaped
 * `{id: value, name: translateOption(value)}`.
 *
 * @param {object} props - Component props.
 * @param {object} props.picker - Search configuration, in either API mode
 *   (`resource`/`maxEntries`) or constant mode (`values`/`translateOption`).
 * @param {string} [props.picker.resource] - Resource name to search (e.g. `'source'`). Ignored
 *   when `values` is given.
 * @param {number} [props.picker.maxEntries] - Maximum results fetched per search. Ignored when
 *   `values` is given.
 * @param {string[]} [props.picker.values] - Constant list of raw values to pick from, switching
 *   this field into constant mode.
 * @param {Function} [props.picker.translateOption] - `(value) => label string` for each `values`
 *   entry. Required when `values` is given.
 * @param {{id: number|string, name: string}|null} props.value - Currently picked item, or null.
 * @param {Function} props.onChange - Called with the newly picked item when one is selected.
 * @param {string} props.label - Translated field label.
 * @param {string} props.searchPlaceholder - Translated placeholder for the search input.
 * @param {string[]} [props.errors] - Field-level error codes, rendered through `FieldErrors`.
 * @param {string} [props.id] - Optional DOM id for the field's wrapper.
 * @returns {React.ReactElement} Rendered single resource picker field.
 */
export default function SingleResourcePickerField({
  picker, value, onChange, label, searchPlaceholder, errors = [], id,
}) {
  const [searching, setSearching] = useState(false);
  const handleCancel = () => setSearching(false);

  const handleSelect = (item) => {
    setSearching(false);
    onChange(item);
  };

  return SingleResourcePickerFieldHelper.render(
    {
      picker, value, label, searchPlaceholder, searching, errors, id,
    },
    {
      onSelect: handleSelect,
      onReopenSearch: () => setSearching(true),
      onCancel: handleCancel,
      onBlur: buildFieldBlurHandler(handleCancel),
    },
  );
}
