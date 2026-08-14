import { useState } from 'react';
import StlModelsHelper from './helpers/StlModelsHelper.jsx';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import buildFilteredHref from '../../../../utils/routing/buildFilteredHref.js';

const BASE_PATH = '#/miniatures/stl_models';

/**
 * Build the hash URL for applying STL model filters, resetting pagination to page 1.
 *
 * @param {{name?: string, type?: string, size?: string, race?: string[], roles?: string[],
 *   source?: number[], collection?: number[], tags?: string[]}} filters - Filters to apply, as
 *   built by `StlModelFiltersController#buildQuery` (blank/empty fields already omitted).
 * @returns {string} Hash including the reset page and the active filters.
 */
export function buildFilterQueryHash(filters) {
  return buildFilteredHref(BASE_PATH, filters);
}

/**
 * Render the STL models index page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}), so `StlModelsHelper` can conditionally render the "New STL
 *   model" action. `/miniatures/stl_models` stays open to every authenticated viewer — the list
 *   itself keeps rendering regardless of this check's result. The "New STL model" action is a
 *   plain navigation link to `/miniatures/stl_models/new` (issue #1069 restored the full-page
 *   creation flow, replacing the former in-place modal — a real page navigation reloads the list
 *   naturally on return, so no `refreshToken`/`onSuccess` plumbing is needed here anymore). The
 *   filters bar (issue #1107) reads/writes its active query params through the hash, bumping
 *   `refreshToken` on every query/clear so `ListPage` refetches without a full remount —
 *   `activeFilters` is passed through as the raw `URLSearchParams` (not
 *   `Object.fromEntries(...)`), so `Pagination`'s own `new URLSearchParams(...)` clone preserves
 *   the filters bar's multi-value fields (`race`/`roles`/`source`/`collection`/`tags`) instead of
 *   collapsing each to its last value.
 * @returns {React.ReactElement} STL models page.
 */
export default function StlModels() {
  const isStaffOrSuperUser = useStaffOrSuperUser();
  const [refreshToken, setRefreshToken] = useState(0);
  const activeFilters = new HashRouteResolver().getFilterParams();
  const refresh = () => setRefreshToken((token) => token + 1);

  const handleFilterQuery = (filters) => {
    window.location.hash = buildFilterQueryHash(filters);
    refresh();
  };

  const handleFilterClear = () => {
    window.location.hash = BASE_PATH;
    refresh();
  };

  return StlModelsHelper.render(
    { isStaffOrSuperUser, refreshToken, activeFilters },
    { onFilterQuery: handleFilterQuery, onFilterClear: handleFilterClear },
  );
}
