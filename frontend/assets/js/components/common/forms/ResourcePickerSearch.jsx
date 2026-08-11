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
 * Shared resource-picker search core: a debounced (300ms) name-search text input plus its
 * results list, backed by `RequestStore` (resource-based, not URL-based) rather than a raw
 * fetch/URL — mirrors `GiveItemModal`'s own PC/NPC search debounce pattern. Not used directly in
 * a form; wrapped by `SingleResourcePickerField`/`MultiResourcePickerField` instead.
 *
 * @param {object} props - Component props.
 * @param {string} props.resource - Resource name to search (e.g. `'source'`, `'collection'`).
 * @param {number} props.maxEntries - Maximum results fetched per search.
 * @param {Function} props.onSelect - Called with the picked result item when a row is clicked.
 * @param {string} props.searchPlaceholder - Caller-supplied translated placeholder for the
 *   search input (no built-in i18n, matching `Badge`/`TagsField`'s convention).
 * @returns {React.ReactElement} Rendered search input and results list.
 */
export default function ResourcePickerSearch({
  resource, maxEntries, onSelect, searchPlaceholder,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      fetchResourcePickerResults({ resource, maxEntries, searchTerm })
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [resource, maxEntries, searchTerm]);

  return ResourcePickerSearchHelper.render(
    { searchTerm, results, searchPlaceholder },
    { onSearchChange: setSearchTerm, onSelect },
  );
}
