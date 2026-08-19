import buildFilterQueryHash from '../../../../../../utils/routing/buildFilteredHref.js';

/**
 * Reusable hook bundling the `onFilterQuery`/`onFilterClear` pair shared by list pages with a
 * filters bar: applying filters navigates to `basePath` plus the built filter query hash,
 * clearing navigates back to the bare `basePath`; both then re-trigger a refresh.
 *
 * @param {string} basePath - Page's base hash path (e.g. `#/games/demo/npcs`), with no filter
 *   query string.
 * @param {Function} refresh - Called to re-trigger the page's data fetch after navigating.
 * @returns {{onFilterQuery: Function, onFilterClear: Function}} `onFilterQuery(filters)` —
 *   navigates to `basePath` with the given filters applied; `onFilterClear()` — navigates back
 *   to the bare `basePath`.
 */
export default function useFilterHandlers(basePath, refresh) {
  const onFilterQuery = (filters) => {
    window.location.hash = buildFilterQueryHash(basePath, filters);
    refresh();
  };

  const onFilterClear = () => {
    window.location.hash = basePath;
    refresh();
  };

  return { onFilterQuery, onFilterClear };
}
