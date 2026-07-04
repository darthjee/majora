import { useEffect, useMemo, useState } from 'react';
import GameTreasuresController, { getGameSlugFromTreasuresHash } from './controllers/GameTreasuresController.js';
import GameTreasuresHelper from './helpers/GameTreasuresHelper.jsx';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';

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
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTreasure, setSelectedTreasure] = useState(null);

  const controller = useMemo(
    () => new GameTreasuresController(setTreasures, setPagination, setLoading, setError, null, setIsSuperUser),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = getGameSlugFromTreasuresHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/treasures`;
  const backHref = `#/games/${gameSlug}`;

  const handleUploadClick = (treasure) => {
    setSelectedTreasure(treasure);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return GameTreasuresHelper.renderLoading();
  if (error) return GameTreasuresHelper.renderError(error);

  return (
    <>
      {GameTreasuresHelper.render(treasures, pagination, basePath, backHref, isSuperUser, handleUploadClick)}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/treasures/${selectedTreasure?.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
