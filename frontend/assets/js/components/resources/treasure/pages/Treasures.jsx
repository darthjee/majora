import { useEffect, useMemo, useState } from 'react';
import TreasuresHelper from './helpers/TreasuresHelper.jsx';
import TreasuresAccessController from './controllers/TreasuresAccessController.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import buildFilteredHref from '../../../../utils/routing/buildFilteredHref.js';

const BASE_PATH = '#/treasures';

/**
 * Build the hash URL for applying treasure filters, resetting pagination to page 1.
 *
 * @param {{game_type?: string, min_value?: string, max_value?: string, name?: string}} filters -
 *   Filters to apply, as built by `TreasureFiltersController#buildQuery` (blank fields already
 *   omitted).
 * @returns {string} Hash including the reset page and the active filters.
 */
export function buildFilterQueryHash(filters) {
  return buildFilteredHref(BASE_PATH, filters);
}

/**
 * Render treasures index page.
 *
 * @description Redirects any viewer who is neither staff nor a superuser away to the home page
 *   before rendering anything else (via `TreasuresAccessController`) — this page's list itself
 *   is fetched through the shared `ListPage`/`listTypeConfig` abstraction (`treasures-global`),
 *   which resolves the same staff-or-superuser check independently for its own per-item
 *   action-bar gating.
 * @returns {React.ReactElement} Treasures page.
 */
export default function Treasures() {
  const [allowed, setAllowed] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTreasure, setSelectedTreasure] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const controller = useMemo(() => new TreasuresAccessController(setAllowed), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());
  const refresh = () => setRefreshToken((token) => token + 1);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    refresh();
  };

  const handleFilterQuery = (filters) => {
    window.location.hash = buildFilterQueryHash(filters);
    refresh();
  };

  const handleFilterClear = () => {
    window.location.hash = BASE_PATH;
    refresh();
  };

  if (!allowed) {
    return TreasuresHelper.renderLoading();
  }

  return TreasuresHelper.render(
    { basePath: BASE_PATH, refreshToken, activeFilters, showUploadModal, selectedTreasure },
    {
      onUploadClick: (treasure) => {
        setSelectedTreasure(treasure);
        setShowUploadModal(true);
      },
      onUploadClose: () => setShowUploadModal(false),
      onUploadSuccess: handleUploadSuccess,
      onFilterQuery: handleFilterQuery,
      onFilterClear: handleFilterClear,
    },
  );
}
