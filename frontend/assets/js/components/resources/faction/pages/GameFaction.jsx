import { useEffect, useMemo, useState } from 'react';
import FactionDetailHelper from './helpers/FactionDetailHelper.jsx';
import GameFactionController from './controllers/GameFactionController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RecruitModal from './elements/RecruitModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game faction detail page (issue #812): loads a single `Faction` (via
 * {@link GameFactionController}) and delegates rendering to {@link FactionDetailHelper}. Also
 * wires up the photo upload modal, gated on the controller's independently-derived
 * `canUploadPhoto` flag, mirroring `GamePossession`'s upload modal wiring. Also renders an Edit
 * button, gated on the controller's independently-derived `canEdit` flag (DM/staff only, per the
 * update-permission correction documented in `docs/agents/plans/812-add-factions/plan.md`'s
 * "Shared contracts" section). Renders the recruit modal (issue #943), gated the same way as the
 * photo-upload button (`canUploadPhoto`); the modal itself is routed through the controller's
 * independently-derived `canRecruitHidden` flag (superuser/dm/staff) so a hidden character can
 * only be recruited by a dm/admin/staff caller through the elevated acquire endpoint. A successful
 * recruit purges the `faction` cache and bumps `refreshToken`, re-triggering the character-list
 * panel's fetch, mirroring `GameDocument.jsx`'s give-modal cache-purge-then-refetch pattern.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Faction controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game faction detail page element.
 */
export default function GameFaction({ ControllerClass = GameFactionController }) {
  const [faction, setFaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [canRecruitHidden, setCanRecruitHidden] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const controller = useMemo(
    () => new ControllerClass(setFaction, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanRecruitHidden),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GameFactionController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/factions`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // mirroring `GamePossession.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'faction' });
    controller.buildEffect()();
  };

  const handleRecruitSuccess = () => {
    RequestStore.purge({ resource: 'faction' });
    setRefreshToken((token) => token + 1);
  };

  if (loading) return FactionDetailHelper.renderLoading();
  if (error) return FactionDetailHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/factions/${faction?.id}/edit`;
  const uploadPath = resourceConfig.get('POST', 'faction', 'single').regular.path({ gameSlug, id: faction?.id });

  return (
    <>
      {FactionDetailHelper.render(faction, backHref, editHref, canEdit, canUploadPhoto, gameSlug, refreshToken, {
        onUploadClick: () => setShowUploadModal(true),
        onRecruitClick: () => setShowRecruitModal(true),
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <RecruitModal
        show={showRecruitModal}
        faction={faction ?? {}}
        gameSlug={gameSlug}
        canRecruitHidden={canRecruitHidden}
        onClose={() => setShowRecruitModal(false)}
        onSuccess={handleRecruitSuccess}
      />
    </>
  );
}
