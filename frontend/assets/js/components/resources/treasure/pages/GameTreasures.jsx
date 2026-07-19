import { useState } from 'react';
import GameTreasuresHelper from './helpers/GameTreasuresHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import buildFilterQueryHash from '../../../../utils/routing/buildFilteredHref.js';

/**
 * Game Treasures index page.
 *
 * @returns {React.ReactElement} Game treasures page element.
 */
export default function GameTreasures() {
  const [canEdit, setCanEdit] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTreasure, setSelectedTreasure] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const gameSlug = BasePageController.extractParam(
    '/games/:game_slug/treasures', 'game_slug', window.location.hash,
  );
  const basePath = `#/games/${gameSlug}/treasures`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/treasures/new`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const refresh = () => setRefreshToken((token) => token + 1);

  return GameTreasuresHelper.render(
    {
      gameSlug,
      basePath,
      backHref,
      newHref,
      canEdit,
      refreshToken,
      activeFilters,
      showUploadModal,
      selectedTreasure,
      showAddModal,
    },
    {
      onCanEditChange: setCanEdit,
      onUploadClick: (treasure) => {
        setSelectedTreasure(treasure);
        setShowUploadModal(true);
      },
      onUploadClose: () => setShowUploadModal(false),
      onUploadSuccess: () => {
        setShowUploadModal(false);
        refresh();
      },
      onAddClick: () => setShowAddModal(true),
      onAddClose: () => setShowAddModal(false),
      onAddSuccess: () => {
        setShowAddModal(false);
        refresh();
      },
      onFilterQuery: (filters) => {
        window.location.hash = buildFilterQueryHash(basePath, filters);
        refresh();
      },
      onFilterClear: () => {
        window.location.hash = basePath;
        refresh();
      },
    },
  );
}
