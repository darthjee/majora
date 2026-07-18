import { useEffect, useMemo, useState } from 'react';
import GameTreasuresController from './controllers/GameTreasuresController.js';
import GameTreasuresHelper from './helpers/GameTreasuresHelper.jsx';
import PhotoUploadModal from '../../../common/PhotoUploadModal.jsx';
import AddGameTreasureModal from './elements/AddGameTreasureModal.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import TreasureFilters from './elements/TreasureFilters.jsx';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';

/**
 * Game Treasures index page.
 *
 * @returns {React.ReactElement} Game treasures page element.
 */
export default function GameTreasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTreasure, setSelectedTreasure] = useState(null);

  const controller = useMemo(
    () => new GameTreasuresController(setTreasures, setPagination, setLoading, setError, null, setCanEdit),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const gameSlug = GameTreasuresController.getGameSlugFromTreasuresHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/treasures`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/treasures/new`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const handleUploadClick = (treasure) => {
    setSelectedTreasure(treasure);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    controller.buildEffect()();
  };

  const handleFilterQuery = (filters) => {
    window.location.hash = GameTreasuresController.buildFilterQueryHash(basePath, filters);
    controller.buildEffect()();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    controller.buildEffect()();
  };

  if (loading) return GameTreasuresHelper.renderLoading();
  if (error) return GameTreasuresHelper.renderError(error);

  return (
    <>
      {GameTreasuresHelper.render(
        treasures, pagination, basePath, gameSlug, backHref, canEdit, newHref, handleUploadClick,
        () => setShowAddModal(true),
        activeFilters,
        <TreasureFilters onQuery={handleFilterQuery} onClear={handleFilterClear} showGameType={false} />,
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/treasures/${selectedTreasure?.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <AddGameTreasureModal
        show={showAddModal}
        gameSlug={gameSlug}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}
