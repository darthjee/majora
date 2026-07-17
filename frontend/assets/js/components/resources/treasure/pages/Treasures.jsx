import { useEffect, useMemo, useState } from 'react';
import TreasuresController from './controllers/TreasuresController.js';
import TreasuresHelper from './helpers/TreasuresHelper.jsx';
import PhotoUploadModal from '../../../common/PhotoUploadModal.jsx';
import TreasureFilters from './elements/TreasureFilters.jsx';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';

/**
 * Render treasures index page.
 *
 * @returns {React.ReactElement} Treasures page.
 */
export default function Treasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTreasure, setSelectedTreasure] = useState(null);

  const controller = useMemo(
    () => new TreasuresController(setTreasures, setPagination, setLoading, setError, null, setIsSuperUser),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const basePath = '#/treasures';
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const handleUploadClick = (treasure) => {
    setSelectedTreasure(treasure);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleFilterQuery = (filters) => {
    window.location.hash = TreasuresController.buildFilterQueryHash(basePath, filters);
    controller.buildEffect()();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    controller.buildEffect()();
  };

  if (loading) {
    return TreasuresHelper.renderLoading();
  }

  if (error) {
    return TreasuresHelper.renderError(error);
  }

  return (
    <>
      {TreasuresHelper.render(
        treasures, pagination, isSuperUser, handleUploadClick, activeFilters,
        <TreasureFilters onQuery={handleFilterQuery} onClear={handleFilterClear} />,
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/treasures/${selectedTreasure?.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
