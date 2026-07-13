import { useEffect, useMemo, useState } from 'react';
import GameController from './controllers/GameController.js';
import GameHelper from './helpers/GameHelper.jsx';
import PhotoUploadModal from '../../../common/PhotoUploadModal.jsx';

/**
 * Game detail page.
 *
 * @returns {React.ReactElement} Game detail page element.
 */
export default function Game() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pcs, setPcs] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new GameController(setGame, setLoading, setError, setPcs, setNpcs),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return GameHelper.renderLoading();
  if (error) return GameHelper.renderError(error);

  return (
    <>
      {GameHelper.render(game, pcs, npcs, { onOpenUploadModal: () => setShowUploadModal(true) })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${game.game_slug}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
