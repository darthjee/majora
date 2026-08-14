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
 * `RemovableBadge`s — used for `StlModel`'s `sources`/`collections` fields (API mode,
 * `resource`/`maxEntries`) as well as its `races`/`roles` fields (constant mode,
 * `values`/`translateOption`; see `ResourcePickerSearch`). In constant mode, each picked item is
 * shaped `{id: value, name: translateOption(value)}` — `id` is the raw constant string itself,
 * reusing the same `{id, name}`-keyed badge rendering as-is.
 *
 * @param {object} props - Component props.
 * @param {string} [props.resource] - Resource name to search (e.g. `'source'`, `'collection'`).
 *   Ignored when `values` is given.
 * @param {number} [props.maxEntries] - Maximum results fetched per search. Ignored when `values`
 *   is given.
 * @param {string[]} [props.values] - Constant list of raw `db_value`s to pick from, switching
 *   this field into constant mode.
 * @param {Function} [props.translateOption] - `(value) => label string` for each `values` entry.
 *   Required when `values` is given.
 * @param {{id: number|string, name: string}[]} props.value - Current selection.
 * @param {Function} props.onChange - Called with the new selection array on pick/remove.
 * @param {string} props.label - Translated field label.
 * @param {string} props.searchPlaceholder - Translated placeholder for the search input.
 * @param {string} props.removeLabel - Translated label for each badge's remove button.
 * @returns {React.ReactElement} Rendered multi resource picker field.
 */
export default function MultiResourcePickerField({
  resource, maxEntries, values, translateOption, value, onChange, label, searchPlaceholder,
  removeLabel,
}) {
  return (
    <div className="mb-3">
      <span className="form-label d-block">{label}</span>
      <ResourcePickerSearch
        resource={resource}
        maxEntries={maxEntries}
        values={values}
        translateOption={translateOption}
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
