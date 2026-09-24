import { useEffect, useState } from 'react';
import RequestStore from '../../../utils/requests/RequestStore.js';
import ResourcePickerSearchHelper from './helpers/ResourcePickerSearchHelper.jsx';

/**
 * Debounce delay (ms) applied to the search input before fetching, mirroring
 * `GiveItemModal`'s own `SEARCH_DEBOUNCE_MS`.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Fetch a page of `resource` results (e.g. `'source'`, `'collection'`) through `RequestStore`
 * (`resource.collection`), scoped by name and capped at `maxEntries`. Exported as a plain, named
 * function so it can be exercised directly in specs without depending on the debounce effect
 * actually firing (`renderToStaticMarkup` never runs effects).
 *
 * @param {object} params - Params.
 * @param {string} params.resource - Resource name (e.g. `'source'`, `'collection'`).
 * @param {number} params.maxEntries - Maximum results to fetch, used as `per_page`.
 * @param {string} params.searchTerm - Current name filter.
 * @returns {Promise<object[]>} Resolves to the fetched results, defaulting to an empty array.
 */
export function fetchResourcePickerResults({ resource, maxEntries, searchTerm }) {
  return RequestStore.ensure({
    componentName: 'ResourcePickerSearch',
    resource,
    quantityType: 'collection',
    query: { per_page: maxEntries, name: searchTerm },
  }).then(({ data }) => (Array.isArray(data) ? data : []));
}

/**
 * Default maximum number of entries returned by `filterConstantResults`, used when no
 * `maxEntries` is given in constant mode (in API mode, `maxEntries` maps to `per_page` instead).
 */
export const MAX_CONSTANT_RESULTS = 5;

/**
 * Filter a local constant `values` list by substring match (case-insensitive) against each
 * value's translated label, shaping matches as `{id, name}` — mirroring the `{id, name}` shape
 * `fetchResourcePickerResults` resolves to, so both modes render through the same
 * `ResourcePickerSearchHelper`. `id` is the raw constant string itself; there is never a value
 * outside `values`, so — unlike the API-backed mode — there is no equivalent of "create new" to
 * guard against. Results are capped at `maxEntries` entries (`MAX_CONSTANT_RESULTS` when absent).
 * Exported as a plain, named
 * function so it can be exercised directly in specs.
 *
 * @param {object} params - Params.
 * @param {string[]} params.values - Constant list of raw `db_value`s to filter/offer.
 * @param {Function} params.translateOption - `(value) => label string` for each entry.
 * @param {string} params.searchTerm - Current name filter.
 * @param {number} [params.maxEntries] - Maximum entries returned. Defaults to
 *   `MAX_CONSTANT_RESULTS`.
 * @returns {{id: string, name: string}[]} Up to `maxEntries` matching entries, in `values`'
 *   original order.
 */
export function filterConstantResults({
  values, translateOption, searchTerm, maxEntries = MAX_CONSTANT_RESULTS,
}) {
  const term = searchTerm.trim().toLowerCase();

  return values
    .map((value) => ({ id: value, name: translateOption(value) }))
    .filter((item) => item.name.toLowerCase().includes(term))
    .slice(0, maxEntries);
}

/**
 * Build the search input's `keydown` handler: on `Escape`, calls `onCancel` (when given) and
 * stops the event there, so an enclosing modal is not closed by the same key press. Any other
 * key, or a missing `onCancel`, is left untouched. Exported as a plain, named function so it can
 * be exercised directly in specs.
 *
 * @param {Function} [onCancel] - Called when `Escape` is pressed in the search input.
 * @returns {Function} `(event) => void` keydown handler.
 */
export function buildCancelKeyDownHandler(onCancel) {
  return (event) => {
    if (event.key !== 'Escape' || !onCancel) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onCancel();
  };
}

/**
 * Shared resource-picker search core: a name-search text input plus its results list. Supports
 * two mutually exclusive result sources, selected by which prop pair is given:
 * - API mode (`resource`/`maxEntries`): a debounced (300ms) `RequestStore`-backed search
 *   (resource-based, not URL-based) — mirrors `GiveItemModal`'s own PC/NPC search debounce
 *   pattern.
 * - Constant mode (`values`/`translateOption`): synchronous, client-side substring filtering of
 *   an already-known constant list (e.g. `RACE_VALUES`/`ROLE_VALUES`) — no backend call, and no
 *   debounce needed since filtering is instantaneous.
 * Not used directly in a form; wrapped by `SingleResourcePickerField`/`MultiResourcePickerField`
 * instead.
 *
 * @param {object} props - Component props.
 * @param {string} [props.resource] - Resource name to search (e.g. `'source'`, `'collection'`).
 *   Ignored when `values` is given.
 * @param {number} [props.maxEntries] - Maximum results per search: fetched per page in API mode,
 *   or listed in constant mode (defaults to `MAX_CONSTANT_RESULTS` there when absent).
 * @param {string[]} [props.values] - Constant list of raw `db_value`s to filter/offer, switching
 *   this component into constant mode.
 * @param {Function} [props.translateOption] - `(value) => label string` for each `values` entry.
 *   Required when `values` is given.
 * @param {Function} props.onSelect - Called with the picked result item when a row is clicked.
 * @param {Function} [props.onCancel] - Called when `Escape` is pressed in the search input.
 * @param {boolean} [props.autoFocus] - Whether the search input grabs focus when mounted.
 * @param {string} props.searchPlaceholder - Caller-supplied translated placeholder for the
 *   search input (no built-in i18n, matching `Badge`/`TagsField`'s convention).
 * @returns {React.ReactElement} Rendered search input and results list.
 */
export default function ResourcePickerSearch({
  resource, maxEntries, values, translateOption, onSelect, searchPlaceholder, onCancel,
  autoFocus = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const isConstantMode = Array.isArray(values);

  useEffect(() => {
    if (isConstantMode) {
      return undefined;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      fetchResourcePickerResults({ resource, maxEntries, searchTerm })
        .then((data) => {
          if (!cancelled) setApiResults(data);
        })
        .catch(() => {
          if (!cancelled) setApiResults([]);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isConstantMode, resource, maxEntries, searchTerm]);

  const results = isConstantMode
    ? filterConstantResults({ values, translateOption, searchTerm, maxEntries })
    : apiResults;

  return ResourcePickerSearchHelper.render(
    { searchTerm, results, searchPlaceholder, autoFocus },
    { onSearchChange: setSearchTerm, onSelect, onKeyDown: buildCancelKeyDownHandler(onCancel) },
  );
}
