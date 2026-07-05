import { useEffect, useMemo, useState } from 'react';
import NpcCharacterController, { getNpcCharacterParamsFromHash }
  from './controllers/NpcCharacterController.js';
import CharacterHelper from './helpers/CharacterHelper.jsx';
import AuthEvents from '../../utils/AuthEvents.js';
import AuthStorage from '../../utils/AuthStorage.js';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';
import SlainConfirmModal from '../elements/SlainConfirmModal.jsx';
import SlainConfirmController from '../elements/controllers/SlainConfirmController.js';

/**
 * NPC character detail page.
 *
 * @returns {React.ReactElement} NPC character detail page element.
 */
export default function NpcCharacter() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSlainModal, setShowSlainModal] = useState(false);

  const controller = useMemo(
    () => new NpcCharacterController(setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    const handleAuthChanged = () => controller.buildEffect()();
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, [controller]);

  const slainController = useMemo(
    () => new SlainConfirmController(() => {
      setShowSlainModal(false);
      controller.buildEffect()();
    }),
    [controller],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug } = getNpcCharacterParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/npcs`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleConfirmSlain = () => {
    slainController.handleConfirm(gameSlug, character, AuthStorage.getToken());
  };

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);

  return (
    <>
      {CharacterHelper.render(character, backHref, {
        onOpenUploadModal: () => setShowUploadModal(true),
        onOpenSlainModal: () => setShowSlainModal(true),
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/npcs/${character.id}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <SlainConfirmModal
        show={showSlainModal}
        slain={character.slain}
        onCancel={() => setShowSlainModal(false)}
        onConfirm={handleConfirmSlain}
      />
    </>
  );
}
