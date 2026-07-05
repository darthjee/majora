import { useEffect, useMemo, useState } from 'react';
import GameNpcsController, { getGameSlugFromNpcsHash } from './controllers/GameNpcsController.js';
import GameCharactersHelper from './helpers/GameCharactersHelper.jsx';
import Translator from '../../i18n/Translator.js';
import AuthStorage from '../../utils/AuthStorage.js';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';
import SlainConfirmModal from '../elements/SlainConfirmModal.jsx';
import SlainConfirmController from '../elements/controllers/SlainConfirmController.js';

/**
 * Game Non-Player Characters index page.
 *
 * @returns {React.ReactElement} Game NPCs page element.
 */
export default function GameNpcs() {
  const [npcs, setNpcs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [slainTarget, setSlainTarget] = useState(null);

  const controller = useMemo(
    () => new GameNpcsController(setNpcs, setPagination, setLoading, setError, null, null, setCanEdit),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const slainController = useMemo(
    () => new SlainConfirmController(() => {
      setSlainTarget(null);
      controller.buildEffect()();
    }),
    [controller],
  );

  const gameSlug = getGameSlugFromNpcsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/npcs`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/npcs/new`;

  const handleUploadSuccess = () => {
    setUploadTarget(null);
    controller.buildEffect()();
  };

  const handleConfirmSlain = () => {
    slainController.handleConfirm(gameSlug, slainTarget, AuthStorage.getToken());
  };

  if (loading) return GameCharactersHelper.renderLoading();
  if (error) return GameCharactersHelper.renderError(error);

  return (
    <>
      {GameCharactersHelper.render(
        npcs, pagination, basePath, gameSlug, Translator.t('game_npcs_page.title'), 'npc', backHref,
        canEdit, newHref, setUploadTarget, setSlainTarget,
      )}
      <PhotoUploadModal
        show={uploadTarget !== null}
        uploadPath={`/games/${gameSlug}/npcs/${uploadTarget?.id}/photo_upload.json`}
        onClose={() => setUploadTarget(null)}
        onSuccess={handleUploadSuccess}
      />
      <SlainConfirmModal
        show={slainTarget !== null}
        slain={slainTarget?.slain}
        onCancel={() => setSlainTarget(null)}
        onConfirm={handleConfirmSlain}
      />
    </>
  );
}
