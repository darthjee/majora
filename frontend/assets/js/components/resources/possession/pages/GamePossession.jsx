import { useEffect, useMemo, useState } from 'react';
import PossessionDetailHelper from './helpers/PossessionDetailHelper.jsx';
import GamePossessionController from './controllers/GamePossessionController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game possession detail page (issue #1074): loads a single `GamePossession` (via
 * {@link GamePossessionController}, which picks between the public and elevated `full.json`
 * endpoint based on the requester's game-level edit permission) and delegates rendering to
 * {@link PossessionDetailHelper}. Also wires up the photo upload modal, gated on the
 * controller's independently-derived `canUploadPhoto` flag, mirroring `GameItem`'s upload modal
 * wiring. Also renders an Edit button, gated on the controller's independently-derived `canEdit`
 * flag. Unlike `GameItem`, renders no "give possession" modal — PC/NPC ownership is out of scope
 * here, tracked separately in #1076.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Possession controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game possession detail page element.
 */
export default function GamePossession({ ControllerClass = GamePossessionController }) {
  const [possession, setPossession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setPossession, setLoading, setError, setCanEdit, setCanUploadPhoto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GamePossessionController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/possessions`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // mirroring `GameItem.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'possession' });
    controller.buildEffect()();
  };

  if (loading) return PossessionDetailHelper.renderLoading();
  if (error) return PossessionDetailHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/possessions/${possession?.id}/edit`;
  const uploadPath = resourceConfig.get('POST', 'possession', 'single').regular.path({ gameSlug, id: possession?.id });

  return (
    <>
      {PossessionDetailHelper.render(
        possession, backHref, editHref, canEdit, canUploadPhoto, () => setShowUploadModal(true),
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
