import { useState } from 'react';
import SingleResourcePickerFieldHelper from './helpers/SingleResourcePickerFieldHelper.jsx';

/**
 * Single-pick wrapper around `ResourcePickerSearch`: shows the search core while no item is
 * picked, then swaps to a plain (non-removable) `Badge` for the picked item — clicking that
 * badge re-opens the search so a different item can be picked, replacing `value`. There is no
 * separate "clear to none" affordance; re-picking is the only way to change a selection.
 *
 * @param {object} props - Component props.
 * @param {string} props.resource - Resource name to search (e.g. `'source'`).
 * @param {number} props.maxEntries - Maximum results fetched per search.
 * @param {{id: number, name: string}|null} props.value - Currently picked item, or null.
 * @param {Function} props.onChange - Called with the newly picked item when one is selected.
 * @param {string} props.label - Translated field label.
 * @param {string} props.searchPlaceholder - Translated placeholder for the search input.
 * @returns {React.ReactElement} Rendered single resource picker field.
 */
export default function SingleResourcePickerField({
  resource, maxEntries, value, onChange, label, searchPlaceholder,
}) {
  const [searching, setSearching] = useState(false);

  const handleSelect = (item) => {
    setSearching(false);
    onChange(item);
  };

  return SingleResourcePickerFieldHelper.render(
    {
      resource, maxEntries, value, label, searchPlaceholder, searching,
    },
    { onSelect: handleSelect, onReopenSearch: () => setSearching(true) },
  );
}
