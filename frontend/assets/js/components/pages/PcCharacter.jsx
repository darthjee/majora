import { useEffect, useMemo, useState } from 'react';
import PcCharacterController from './controllers/PcCharacterController.js';
import CharacterHelper from './helpers/CharacterHelper.jsx';
import AuthEvents from '../../utils/AuthEvents.js';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';

/**
 * PC character detail page.
 *
 * @returns {React.ReactElement} PC character detail page element.
 */
export default function PcCharacter() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new PcCharacterController(setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    const handleAuthChanged = () => controller.buildEffect()();
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug } = PcCharacterController.getPcCharacterParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/pcs`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);

  return (
    <>
      {CharacterHelper.render(character, backHref, { onOpenUploadModal: () => setShowUploadModal(true) })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/pcs/${character.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
