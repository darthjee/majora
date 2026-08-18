import { useEffect, useMemo, useState } from 'react';
import CommonItemDetailHelper from './helpers/CommonItemDetailHelper.jsx';
import GameCommonItemController from './controllers/GameCommonItemController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game common item detail page (issue #826): loads a single `GameCommonItem` (via
 * {@link GameCommonItemController}, which picks between the public and elevated `full.json`
 * endpoint based on the requester's game-level edit permission) and delegates rendering to
 * {@link CommonItemDetailHelper}. Also wires up the photo upload modal, gated on the
 * controller's independently-derived `canUploadPhoto` flag, mirroring `GamePossession`'s upload
 * modal wiring. Also renders an Edit button, gated on the controller's independently-derived
 * `canEdit` flag. `GameCommonItem` has no character-owned family at all, so — like
 * `GamePossession` — there is no "give item" modal here.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Common item controller class to instantiate,
 *   mainly for tests.
 * @returns {React.ReactElement} Game common item detail page element.
 */
export default function GameCommonItem({ ControllerClass = GameCommonItemController }) {
  const [commonItem, setCommonItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setCommonItem, setLoading, setError, setCanEdit, setCanUploadPhoto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GameCommonItemController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/common_items`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // mirroring `GamePossession.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'commonItem' });
    controller.buildEffect()();
  };

  if (loading) return CommonItemDetailHelper.renderLoading();
  if (error) return CommonItemDetailHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/common_items/${commonItem?.id}/edit`;
  const uploadPath = resourceConfig.get('POST', 'commonItem', 'single').regular.path(
    { gameSlug, id: commonItem?.id },
  );

  return (
    <>
      {CommonItemDetailHelper.render(
        commonItem, backHref, editHref, canEdit, canUploadPhoto, () => setShowUploadModal(true),
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
