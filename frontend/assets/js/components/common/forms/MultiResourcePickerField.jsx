import ResourcePickerSearch from './ResourcePickerSearch.jsx';
import RemovableBadge from '../badges/RemovableBadge.jsx';

/**
 * Append `item` to `value`, deduplicated by `id` — appending is a no-op when an item with the
 * same id is already present. Exported as a plain, named function so it can be exercised
 * directly in specs.
 *
 * @param {{id: number, name: string}[]} value - Current selection.
 * @param {{id: number, name: string}} item - Picked item to append.
 * @returns {{id: number, name: string}[]} The selection with `item` appended, unless already
 *   present.
 */
export function appendResourcePick(value, item) {
  if (value.some((entry) => entry.id === item.id)) {
    return value;
  }

  return [...value, item];
}

/**
 * Multi-pick wrapper around `ResourcePickerSearch`: the search core stays open/usable at all
 * times, picking a result appends it (deduped by id) to `value`, rendered below as
 * `RemovableBadge`s — used for `StlModel`'s `sources`/`collections` fields.
 *
 * @param {object} props - Component props.
 * @param {string} props.resource - Resource name to search (e.g. `'source'`, `'collection'`).
 * @param {number} props.maxEntries - Maximum results fetched per search.
 * @param {{id: number, name: string}[]} props.value - Current selection.
 * @param {Function} props.onChange - Called with the new selection array on pick/remove.
 * @param {string} props.label - Translated field label.
 * @param {string} props.searchPlaceholder - Translated placeholder for the search input.
 * @param {string} props.removeLabel - Translated label for each badge's remove button.
 * @returns {React.ReactElement} Rendered multi resource picker field.
 */
export default function MultiResourcePickerField({
  resource, maxEntries, value, onChange, label, searchPlaceholder, removeLabel,
}) {
  return (
    <div className="mb-3">
      <span className="form-label d-block">{label}</span>
      <ResourcePickerSearch
        resource={resource}
        maxEntries={maxEntries}
        searchPlaceholder={searchPlaceholder}
        onSelect={(item) => onChange(appendResourcePick(value, item))}
      />
      <div className="mt-2">
        {value.map((item) => (
          <span key={item.id} className="me-1 d-inline-block">
            <RemovableBadge
              text={item.name}
              removeLabel={removeLabel}
              onRemove={() => onChange(value.filter((entry) => entry.id !== item.id))}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
